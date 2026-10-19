import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";

const directions = [
  {
    label: "Explore",
    text: "Hover over areas of the collage — clickable regions light up.",
  },
  {
    label: "Open",
    text: "Click a highlighted region to open a project or page.",
  },
  {
    label: "Scroll",
    text: "Scroll down to dissolve the collage and reveal the full portfolio.",
  },
];

export default function HelpButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close help" : "How to use"}
        aria-expanded={open}
        className="fixed top-4 right-4 z-[60] flex size-9 items-center justify-center rounded-full border border-black/15 bg-white/90 text-black/70 shadow-sm backdrop-blur-sm transition-colors hover:border-black/30 hover:bg-white hover:text-black md:top-6 md:right-6"
      >
        {open ? <X className="size-4" /> : <HelpCircle className="size-4" />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="absolute top-16 right-4 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-sm border border-black/10 md:top-20 md:right-6"
            style={{ background: "#fafaf8" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-black/10 px-4 py-3">
              <p
                id="help-title"
                className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/40"
              >
                How to use
              </p>
              <h2
                className="mt-1 text-black leading-none"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "1.5rem",
                }}
              >
                Directions
              </h2>
            </div>

            <ol className="flex flex-col gap-4 px-4 py-4">
              {directions.map((d, i) => (
                <li key={d.label} className="flex gap-3">
                  <span className="font-mono text-[10px] text-black/30 pt-0.5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/50 mb-1">
                      {d.label}
                    </p>
                    <p className="text-sm text-black/80 leading-relaxed">
                      {d.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
