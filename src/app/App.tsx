import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MaskGroup from "@/imports/MaskGroup/index";
import Portfolio from "./Portfolio";
import ProjectModal from "./ProjectModal";
import { projectsById, type Project } from "./portfolioData";

// Figma canvas dimensions — design artboard sits at left:-351
const OFFSET_X = 351;
const CW = 5417;
const CH = 2448;

type Hotspot = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Links this collage region to a portfolio section modal / page */
  projectId: string;
};

const hotspots: Hotspot[] = [
  // Photos regions
  { id: "portrait-1811", x: 899, y: 672, w: 383, h: 505, projectId: "photos" },
  { id: "bw-photo-label", x: 3208, y: 749, w: 720, h: 90, projectId: "photos" },
  { id: "image-column", x: 3205, y: 592, w: 471, h: 1169, projectId: "photos" },
  { id: "portrait-3940", x: 4610, y: 1285, w: 403, h: 647, projectId: "photos" },
  { id: "image3-section", x: 186, y: 1315, w: 856, h: 418, projectId: "photos" },
  { id: "image2-section", x: 538, y: 1834, w: 456, h: 503, projectId: "photos" },
  { id: "stamp-grid", x: 1460, y: 1069, w: 1437, h: 1383, projectId: "photos" },

  // WebOps / IT
  { id: "screenshots-cluster", x: 3390, y: 947, w: 1125, h: 830, projectId: "webops-it" },
  { id: "web-ops", x: 699, y: 980, w: 800, h: 200, projectId: "webops-it" },

  // Projects
  { id: "projects", x: 3248, y: 1810, w: 720, h: 130, projectId: "projects" },

  // Entrepreneurship
  { id: "entrepreneurship", x: 868, y: 2150, w: 720, h: 200, projectId: "entrepreneurship" },

  // Web design
  { id: "website-design", x: 4554, y: 1150, w: 620, h: 200, projectId: "web-design" },
  { id: "screenshot-55613", x: 3795, y: 523, w: 1245, h: 629, projectId: "web-design" },

  // Music
  { id: "music", x: 0, y: 1880, w: 700, h: 280, projectId: "music" },
];

export default function App() {
  const [scale, setScale] = useState(1);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<Project | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const updateScale = () => {
      // Fit entire collage inside the viewport (contain)
      setScale(Math.min(window.innerWidth / CW, window.innerHeight / CH));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // 0 while pinned at top; 1 once the track has fully scrolled past
      const raw = -rect.top / (el.offsetHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, raw)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const collageOpacity = 1 - progress;
  const collageScale = 1 + progress * 0.12;
  const collageBlur = progress * 8;
  const interactive = progress < 0.15;

  const openHotspot = (h: Hotspot) => {
    const project = projectsById[h.projectId];
    if (!project) return;
    if (project.href) {
      navigate(project.href);
      return;
    }
    setActive(project);
    setHovered(null);
  };

  return (
    <div style={{ background: "#ffffff" }}>
      {/* Landing track — sticky collage that dissolves on scroll */}
      <div ref={trackRef} style={{ height: "180vh" }}>
        <div
          className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center"
          style={{ background: "#ffffff" }}
        >
          {/* Backdrop that rises as collage dissolves */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "#fafaf8",
              opacity: progress,
            }}
          />

          <div
            style={{
              width: CW * scale,
              height: CH * scale,
              position: "relative",
              opacity: collageOpacity,
              transform: `scale(${collageScale})`,
              filter: collageBlur > 0.1 ? `blur(${collageBlur}px)` : undefined,
              willChange: "opacity, transform, filter",
              pointerEvents: interactive ? "auto" : "none",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: CW,
                height: CH,
                transformOrigin: "top left",
                transform: `scale(${scale}) translateX(${OFFSET_X}px)`,
                position: "relative",
              }}
            >
              <MaskGroup />

              {hotspots.map((h) => (
                <div
                  key={h.id}
                  className="absolute"
                  style={{ left: h.x, top: h.y, width: h.w, height: h.h, zIndex: 10 }}
                  onMouseEnter={() => setHovered(h.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => openHotspot(h)}
                >
                  <div
                    className="size-full transition-all duration-200"
                    style={{
                      outline:
                        hovered === h.id
                          ? "2px solid rgba(0,0,0,0.25)"
                          : "2px solid transparent",
                      background:
                        hovered === h.id ? "rgba(255,255,255,0.08)" : "transparent",
                      cursor: "pointer",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Scroll cue */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-10"
            style={{ opacity: Math.max(0, 1 - progress * 3) }}
          >
            <span
              className="font-mono text-[9px] uppercase tracking-[0.35em] text-black/40"
            >
              Scroll
            </span>
            <div
              className="w-px h-8 origin-top"
              style={{
                background: "rgba(0,0,0,0.25)",
                animation: "scrollCue 1.6s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      </div>

      {/* Portfolio site — revealed after the collage dissolves */}
      <Portfolio />

      {active && <ProjectModal project={active} onClose={() => setActive(null)} />}

      <style>{`
        @keyframes scrollCue {
          0%, 100% { transform: scaleY(0.35); opacity: 0.3; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
