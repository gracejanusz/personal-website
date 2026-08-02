import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

type TimelineProject = {
  date: string;
  title: string;
  description: string;
  tags: string[];
  href: string;
};

const timeline: TimelineProject[] = [
  {
    date: "June 2026",
    title: "Grandpa's Recipes",
    description:
      "After he passed away in December, I digitized his handwritten cookbook — recipes he'd collected and handed down over the years. Use the arrow keys to turn pages, or tap a card to flip it.",
    tags: ["Cookbook", "Digitization", "Web"],
    href: "https://grandpas-recipes.netlify.app/",
  },
  {
    date: "Sep 2025",
    title: "Craps",
    description:
      "My Grandma's boyfriend taught me how to play Craps yesterday. Wanted to maximize my profit when he plays house and I bet.",
    tags: ["Java", "Gambling", "Money"],
    href: "https://github.com/gracejanusz/craps",
  },
  {
    date: "Aug 2025",
    title: "Modelling Cryptocurrencies",
    description: "Trying to find a way to model Bitcoin using pytorch.",
    tags: ["Pytorch", "Pandas", "Market Modeling"],
    href: "https://github.com/gracejanusz/cryptomodelling",
  },
  {
    date: "Jun 2025",
    title: "ASL Learning WebApp",
    description:
      "Converted a Python/ResNet-50 / Streamlit classifier and CSV pipeline into TensorFlow.js for the web.",
    tags: ["TensorFlow.js", "React.js", "RESNET-50", "Webcam"],
    href: "https://www.handsinlearning.co/",
  },
  {
    date: "May 2024",
    title: "MyGrotonApp",
    description:
      "iOS application built in Xcode to integrate with Blackbaud APIs, providing access to student information, class schedules, homework, and teacher details. Developed in collaboration with Groton School as a demonstration project.",
    tags: ["iOS", "Xcode", "Swift", "Blackbaud API"],
    href: "https://github.com/gracejanusz/GrotonApp",
  },
  {
    date: "Dec 2023",
    title: "ZebraSales",
    description:
      "Django-based web marketplace built for Groton students to buy, sell, and trade items. Features include user authentication, item listings, direct messaging, search, and a responsive interface. Created as a final project for Data Structures class.",
    tags: ["Django", "Python", "Web App", "Marketplace"],
    href: "https://github.com/gracejanusz",
  },
  {
    date: "Sep 2023",
    title: "Data Structures Class Projects (Java)",
    description:
      "Collection of Java projects implementing core data structures and algorithms, including arrays, linked lists, stacks, queues, trees, heaps, graphs, hash tables, and sorting/searching algorithms. Built in Eclipse as part of a Data Structures course.",
    tags: ["Java", "Data Structures", "Algorithms", "Eclipse"],
    href: "https://github.com/gracejanusz/DataStructures",
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

export default function Projects() {
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
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-black/35 mb-3">
            Timeline — {String(timeline.length).padStart(2, "0")} entries
          </p>
          <h1
            className="leading-none text-black"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(3rem, 10vw, 7rem)",
              fontStyle: "italic",
            }}
          >
            Projects
          </h1>
          <p
            className="mt-4 max-w-xl text-black/55 leading-relaxed"
            style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.15rem" }}
          >
            A chronological record of builds — from class projects and school tools
            to ML experiments, web apps, and product work.
          </p>
        </div>
      </header>

      <main className="px-4 md:px-8 py-10 md:py-14 max-w-3xl mx-auto w-full">
        <div className="relative">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-black/15" />

          <ol className="flex flex-col gap-8 md:gap-10">
            {timeline.map((project) => (
              <li key={`${project.date}-${project.title}`} className="relative pl-8 md:pl-10">
                <span className="absolute left-0 top-2.5 size-[11px] rounded-full bg-[#fafaf8] border-2 border-black" />

                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block border border-black/15 p-5 md:p-6 transition-all duration-300 hover:border-black"
                  style={{ background: "#f5f4f0" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-black/40 mb-2">
                        {project.date}
                      </p>
                      <h2
                        className="leading-none text-black group-hover:underline underline-offset-4 decoration-black/30"
                        style={{
                          fontFamily: "'Instrument Serif', serif",
                          fontSize: "clamp(1.35rem, 3vw, 1.85rem)",
                        }}
                      >
                        {project.title}
                      </h2>
                    </div>
                    <ArrowUpRight
                      className="size-4 text-black/30 group-hover:text-black transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 mt-1"
                      strokeWidth={1.5}
                    />
                  </div>

                  <p
                    className="mt-3 text-sm leading-relaxed text-black/60"
                    style={{ fontFamily: "'Instrument Serif', serif", fontSize: "1.05rem" }}
                  >
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono uppercase tracking-widest border border-black/20 px-1.5 py-0.5 text-black/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </a>
              </li>
            ))}
          </ol>
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
            Project timeline
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
