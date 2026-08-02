import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";

const photoModules = import.meta.glob(
  "./photos/*.{jpeg,jpg,png,JPG,JPEG,webp}",
  { eager: true, import: "default" },
) as Record<string, string>;

const photos = Object.entries(photoModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, src], i) => ({
    id: String(i + 1).padStart(3, "0"),
    src,
  }));

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

function Lightbox({
  index,
  onClose,
  onPrev,
  onNext,
}: {
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const photo = photos[index];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-5xl overflow-hidden"
        style={{ background: "#f5f4f0", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-black/40">[{photo.id}]</span>
            <h2
              className="text-black leading-none"
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
                fontStyle: "italic",
              }}
            >
              Photos
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-widest text-black/35">
              {index + 1} / {photos.length}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-black/8 transition-colors"
            >
              <X className="size-4 text-black" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="relative bg-neutral-200">
          <img
            key={photo.id}
            src={photo.src}
            alt={`Photograph ${photo.id}`}
            className="w-full max-h-[75vh] object-contain bg-neutral-900"
          />

          {photos.length > 1 && (
            <>
              <button
                onClick={onPrev}
                disabled={index === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white disabled:opacity-20 transition-all"
              >
                <ChevronLeft className="size-4 text-black" strokeWidth={1.5} />
              </button>
              <button
                onClick={onNext}
                disabled={index === photos.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/80 hover:bg-white disabled:opacity-20 transition-all"
              >
                <ChevronRight className="size-4 text-black" strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Photos() {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const countLabel = useMemo(
    () => `${String(photos.length).padStart(2, "0")} frames`,
    [],
  );

  return (
    <div className="relative min-h-screen" style={{ background: "#fafaf8" }}>
      <NoiseOverlay />

      <header className="w-full border-b border-black/10">
        <div className="flex items-center justify-between px-4 md:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-black/45 hover:text-black transition-colors"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.5} />
            Back
          </Link>
          <span
            className="text-sm text-black/60"
            style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
          >
            grace janusz
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/40">
            {new Date().getFullYear()}
          </span>
        </div>

        <div className="px-4 md:px-8 pb-8 pt-4 border-t border-black/10">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-black/35 mb-3">
            Archive — {countLabel}
          </p>
          <h1
            className="leading-none text-black"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(3rem, 10vw, 7rem)",
              fontStyle: "italic",
            }}
          >
            Photos
          </h1>
          <p
            className="mt-4 max-w-xl text-black/55 leading-relaxed"
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.15rem" }}
          >
            Photographic documentation and visual archive — field captures,
            digitised and preserved as part of an ongoing personal practice.
          </p>
        </div>
      </header>

      <main className="px-4 md:px-8 py-8 md:py-12">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 md:gap-4">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setActive(i)}
              className="mb-3 md:mb-4 w-full break-inside-avoid group relative overflow-hidden border border-black/15 hover:border-black transition-all duration-300 text-left"
              style={{ background: "#f5f4f0" }}
            >
              <img
                src={photo.src}
                alt={`Photograph ${photo.id}`}
                loading="lazy"
                className="w-full h-auto grayscale group-hover:grayscale-0 transition-[filter,transform] duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300 pointer-events-none" />
              <span className="absolute top-2 left-2 font-mono text-[9px] tracking-widest text-white/80 bg-black/40 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                [{photo.id}]
              </span>
            </button>
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
            Photographic archive
          </p>
        </div>
        <Link
          to="/"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/40 hover:text-black transition-colors"
        >
          ← Return home
        </Link>
      </footer>

      {active !== null && (
        <Lightbox
          index={active}
          onClose={() => setActive(null)}
          onPrev={() => setActive((i) => (i === null ? i : Math.max(0, i - 1)))}
          onNext={() =>
            setActive((i) =>
              i === null ? i : Math.min(photos.length - 1, i + 1),
            )
          }
        />
      )}
    </div>
  );
}
