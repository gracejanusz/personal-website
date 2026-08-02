import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import imgRectangle2 from "@/imports/MaskGroup/672c67258adf4756e6a08328d58394dbe8a6bf85.png";
import { projects, type Project } from "./portfolioData";
import ProjectModal from "./ProjectModal";

function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-50 opacity-[0.03]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
      }}
    />
  );
}

function HeroName() {
  return (
    <div className="w-full overflow-hidden border-b border-black py-6 md:py-10">
      <h1
        className="whitespace-nowrap text-center leading-none tracking-[-0.02em] text-black px-4"
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "clamp(3rem, 12vw, 11rem)",
          fontStyle: "italic",
        }}
      >
        Grace Janusz
      </h1>
    </div>
  );
}

function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    if (project.href) {
      navigate(project.href);
      return;
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative w-full text-left border border-black/20 overflow-hidden transition-all duration-300 hover:border-black"
      style={{ background: hovered ? "#f5f4f0" : "#fafaf8" }}
    >
      <div className="relative h-48 md:h-64 overflow-hidden bg-neutral-200">
        <img
          src={project.primaryImage}
          alt={project.title}
          className="size-full object-cover grayscale transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
      </div>

      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-black/40 mb-1 font-mono">[{project.index}]</p>
            <h2
              className="leading-none text-black"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "clamp(1.4rem, 3vw, 2rem)",
              }}
            >
              {project.title}
              {project.subtitle ? (
                <>
                  <br />
                  <span className="text-black/50">{project.subtitle}</span>
                </>
              ) : null}
            </h2>
          </div>
          <div className="mt-1 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
            <ArrowUpRight className="size-5 text-black/40 group-hover:text-black" />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {project.tags.map((tag) =>
            tag.href ? (
              <a
                key={tag.label}
                href={tag.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-mono uppercase tracking-widest border border-black/20 px-1.5 py-0.5 text-black/50 hover:border-black hover:text-black transition-colors"
              >
                {tag.label}
              </a>
            ) : (
              <span
                key={tag.label}
                className="text-[10px] font-mono uppercase tracking-widest border border-black/20 px-1.5 py-0.5 text-black/50"
              >
                {tag.label}
              </span>
            ),
          )}
        </div>
      </div>
    </button>
  );
}

export default function Portfolio() {
  const [active, setActive] = useState<Project | null>(null);

  return (
    <div className="relative min-h-screen" style={{ background: "#fafaf8" }}>
      <NoiseOverlay />

      <header className="w-full">
        <HeroName />
        <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-black/10">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-black/40">
            Portfolio
          </span>
          <span
            className="text-sm text-black/60"
            style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
          >
            grace janusz
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-black/40">
            {new Date().getFullYear()}
          </span>
        </div>
      </header>

      <div className="w-full h-32 md:h-48 overflow-hidden border-b border-black/10 relative">
        <img
          src={imgRectangle2}
          alt=""
          className="size-full object-cover grayscale opacity-30"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            className="text-black/20 text-center leading-tight"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(0.65rem, 1.5vw, 1rem)",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
            }}
          >
            WEB OPS / IT — PROJECTS — ENTREPRENEURSHIP — WEB DESIGN — MUSIC — PHOTOS
          </p>
        </div>
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/5" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-black/5" />
      </div>

      <div className="px-4 md:px-8 pt-10 pb-4 flex items-center gap-4">
        <div className="h-px flex-1 bg-black/10" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/40">
          Selected Work
        </span>
        <div className="h-px flex-1 bg-black/10" />
      </div>

      <main className="px-4 md:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setActive(project)}
            />
          ))}
        </div>
      </main>

      <footer className="border-t border-black/10 px-4 md:px-8 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p
            className="text-black leading-none"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
              fontStyle: "italic",
            }}
          >
            Grace Janusz
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 mt-1">
            WebOps · Projects · Ventures · Design · Music · Photos
          </p>
        </div>
        <div className="flex flex-wrap gap-4 md:gap-6">
          {["WEB OPS / IT", "ENTREPRENEURSHIP", "WEB DESIGN", "MUSIC"].map((label) => (
            <span
              key={label}
              className="font-mono text-[9px] uppercase tracking-widest text-black/30"
            >
              {label}
            </span>
          ))}
          <Link
            to="/projects"
            className="font-mono text-[9px] uppercase tracking-widest text-black/30 hover:text-black transition-colors"
          >
            PROJECTS
          </Link>
          <Link
            to="/photos"
            className="font-mono text-[9px] uppercase tracking-widest text-black/30 hover:text-black transition-colors"
          >
            PHOTOS
          </Link>
        </div>
      </footer>

      {active && <ProjectModal project={active} onClose={() => setActive(null)} />}
    </div>
  );
}
