import { useState, useEffect } from "react";
import { X, ArrowUpRight } from "lucide-react";
import type { Project } from "./portfolioData";

export default function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    setActiveImg(0);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [project, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full md:max-w-5xl md:rounded-sm overflow-hidden"
        style={{ background: "#fafaf8", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-black/40">[{project.index}]</span>
            <h2
              className="text-black leading-none"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)",
              }}
            >
              {project.title}{project.subtitle ? ` ${project.subtitle}` : ""}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-black/5 transition-colors rounded-sm"
          >
            <X className="size-4 text-black" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 52px)" }}>
          <div className="grid md:grid-cols-[1fr_320px]">
            <div className="bg-neutral-100 relative">
              <div className="aspect-[4/3] md:aspect-auto md:h-full min-h-[280px] relative overflow-hidden">
                <img
                  src={project.images[activeImg]}
                  alt={project.title}
                  className="size-full object-cover grayscale transition-opacity duration-300"
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/10" />
                  <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/10" />
                  <div className="absolute top-1/2 left-0 right-0 border-t border-white/10" />
                </div>
              </div>

              {project.images.length > 1 && (
                <div className="flex gap-2 p-3 border-t border-black/10 bg-white/50">
                  {project.images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`size-14 overflow-hidden border transition-all duration-200 ${
                        i === activeImg
                          ? "border-black opacity-100"
                          : "border-black/20 opacity-50 hover:opacity-75"
                      }`}
                    >
                      <img
                        src={src}
                        alt=""
                        className="size-full object-cover grayscale"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-black/10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-black/10" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">
                    Overview
                  </span>
                  <div className="h-px flex-1 bg-black/10" />
                </div>
                <p
                  className="text-sm leading-relaxed text-black/70"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {project.description}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-black/10" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">
                    Tags
                  </span>
                  <div className="h-px flex-1 bg-black/10" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) =>
                    tag.href ? (
                      <a
                        key={tag.label}
                        href={tag.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] uppercase tracking-widest border border-black px-2 py-1 text-black hover:bg-black hover:text-[#fafaf8] transition-colors inline-flex items-center gap-1"
                      >
                        {tag.label}
                        <ArrowUpRight className="size-3" strokeWidth={1.5} />
                      </a>
                    ) : (
                      <span
                        key={tag.label}
                        className="font-mono text-[11px] uppercase tracking-widest border border-black px-2 py-1 text-black"
                      >
                        {tag.label}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-black/10">
                <p className="font-mono text-[10px] text-black/30 uppercase tracking-widest">
                  grace janusz — {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
