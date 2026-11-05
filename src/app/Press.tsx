import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

type PressItem = {
  source: string;
  title: string;
  href: string;
};

const press: PressItem[] = [
  {
    source: "Instagram",
    title: "KTP Spotlight!",
    href: "https://www.instagram.com/p/DGC1LQ0uFrD/",
  },
  {
    source: "LinkedIn — Sarah Sterling",
    title: "SOCAP26 Fellows — Rustandy Center",
    href: "https://www.linkedin.com/posts/sarahmsterling_socap26-socapfellows-rustandycenter-share-7513703672095170562-vvfd/",
  },
  {
    source: "Circle Voice",
    title: "Artist of the Issue: Grace Janusz",
    href: "https://circlevoice.org/article/6758-artist-of-the-issue-grace-janusz",
  },
  {
    source: "LinkedIn",
    title: "VentureClub101 Introduction",
    href: "https://www.linkedin.com/posts/grace-janusz-embodies-the-kind-of-initiative-share-7478487536944697345-eBOa/",
  },
  {
    source: "UChicago — Office of National Fellowships",
    title: "UChicago Awards",
    href: "https://ccrf.uchicago.edu/office-national-fellowships/national-scholars",
  },
  {
    source: "HandsIn",
    title: "Grace learns ASL!",
    href: "https://www.handsinlearning.co/about",
  },
];

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

export default function Press() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
          <h1
            className="leading-none text-black"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(3rem, 10vw, 7rem)",
              fontStyle: "italic",
            }}
          >
            Press
          </h1>
        </div>
      </header>

      <main className="px-4 md:px-8 py-10 md:py-14 max-w-3xl mx-auto w-full">
        <ul className="flex flex-col gap-4 md:gap-5">
          {press.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block border border-black/15 p-5 md:p-6 transition-all duration-300 hover:border-black"
                style={{ background: "#f5f4f0" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2
                      className="leading-tight text-black group-hover:underline underline-offset-4 decoration-black/30"
                      style={{
                        fontFamily: "'Instrument Serif', serif",
                        fontSize: "clamp(1.35rem, 3vw, 1.85rem)",
                      }}
                    >
                      {item.title}
                    </h2>
                  </div>
                  <ArrowUpRight
                    className="size-4 text-black/30 group-hover:text-black transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 mt-1"
                    strokeWidth={1.5}
                  />
                </div>
              </a>
            </li>
          ))}
        </ul>
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
        </div>
        <Link
          to="/"
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/40 hover:text-black transition-colors"
        >
          ← Return home
        </Link>
      </footer>
    </div>
  );
}
