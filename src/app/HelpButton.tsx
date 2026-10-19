import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";

const directions = [
  {
    label: "Enter",
    text: "On the intro, hover the computer until it glows, then click the monitor to begin.",
  },
  {
    label: "Search",
    text: "Scroll the search log and click a query to uncover a story line.",
  },
  {
    label: "Case file",
    text: "Each find fills in the case file up top and builds the story on the right.",
  },
  {
    label: "Orbit",
    text: "Drag the figure in the center to spin him around. The scroll wheel still moves the list.",
  },
  {
    label: "Radio",
    text: "Music searches unlock the radio in the bottom-right — click it to change stations.",
  },
  {
    label: "Sound",
    text: "Mute or unmute from the toggle in the bottom-left.",
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
        className="fixed top-4 right-4 z-[60] flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white/80 shadow-sm backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-black/85 hover:text-white md:top-6 md:right-6"
      >
        {open ? <X className="size-4" /> : <HelpCircle className="size-4" />}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="absolute top-16 right-4 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-sm border border-white/10 md:top-20 md:right-6"
            style={{ background: "#0a0a0a" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-white/10 px-4 py-3">
              <p
                id="help-title"
                className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40"
              >
                How to use
              </p>
              <h2
                className="mt-1 text-white leading-none"
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "1.5rem",
                }}
              >
                Directions
              </h2>
            </div>

            <ol className="flex flex-col gap-3.5 px-4 py-4 max-h-[min(70vh,28rem)] overflow-y-auto">
              {directions.map((d, i) => (
                <li key={d.label} className="flex gap-3">
                  <span className="font-mono text-[10px] text-white/30 pt-0.5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 mb-1">
                      {d.label}
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed">
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
