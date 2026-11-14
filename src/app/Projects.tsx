import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import catHanging from "@/app/cats/hanging.png";
import catSpiky from "@/app/cats/spiky.png";
import catGuitar from "@/app/cats/guitar.png";
import catLoaf from "@/app/cats/loaf.png";
import catLongLeft from "@/app/cats/long-left.png";
import catArched from "@/app/cats/arched.png";
import catLongRight from "@/app/cats/long-right.png";
import catSitting from "@/app/cats/sitting.png";
import catUpsideDown from "@/app/cats/upside-down.png";
import catSmallSitting from "@/app/cats/small-sitting.png";
import catStretching from "@/app/cats/stretching.png";
import madeBy from "@/app/cats/made-by.png";
import drawBat from "@/app/drawings/bat.png";
import drawBear from "@/app/drawings/bear.png";
import drawBird from "@/app/drawings/bird.png";
import drawBunny from "@/app/drawings/bunny.png";
import drawCarrot from "@/app/drawings/carrot.png";
import drawCatCurled from "@/app/drawings/cat-curled.png";
import drawCatLeaping from "@/app/drawings/cat-leaping.png";
import drawCatLying from "@/app/drawings/cat-lying.png";
import drawCatTall from "@/app/drawings/cat-tall.png";
import drawDog from "@/app/drawings/dog.png";
import drawFox from "@/app/drawings/fox.png";
import drawGiraffe from "@/app/drawings/giraffe.png";
import drawHeart from "@/app/drawings/heart.png";
import drawMoon from "@/app/drawings/moon.png";
import drawPartyCat from "@/app/drawings/party-cat.png";
import drawPig from "@/app/drawings/pig.png";
import drawRadio from "@/app/drawings/radio.png";
import drawSnail from "@/app/drawings/snail.png";
import drawSpiral from "@/app/drawings/spiral.png";
import drawSquiggle from "@/app/drawings/squiggle.png";
import drawStar from "@/app/drawings/star.png";
import drawTopHatBird from "@/app/drawings/top-hat-bird.png";
import drawWorm from "@/app/drawings/worm.png";

type TimelineProject = {
  date: string;
  title: string;
  description: string;
  tags: string[];
  href: string;
};

const timeline: TimelineProject[] = [
  {
    date: "Nov 2026",
    title: "Strands",
    description:
      "An interactive generative piece: wavy lines with colored bands between them. Drag a line sideways to open the gaps and reveal the photos hidden behind, then click a photo to dive deeper into another. Press S for a new pattern, and turn on the music for chimes as you play.",
    tags: ["Generative", "Canvas", "Interactive", "Web Audio"],
    href: "/strands",
  },
  {
    date: "Oct 2026",
    title: "MADD",
    description:
      "Designed and built for my MADD Design and Practices class at the University of Chicago. An interactive 3D piece that pieces together a stranger's life from 355 searches in the leaked 2006 AOL search logs — click through his queries to uncover his story, sharpen his portrait, and unlock songs on the radio.",
    tags: ["Three.js", "React", "Interactive", "UChicago"],
    href: "/madd",
  },
  {
    date: "Aug 2026",
    title: "This site!",
    description:
      "My personal website — the portfolio, project timeline, and photo archive you're looking at now. The source is on GitHub.",
    tags: ["React", "Vite", "Tailwind", "Three.js"],
    href: "https://github.com/gracejanusz/personal-website",
  },
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

// Hand-drawn cats from Grace's sketch. Widths are ~0.4x the 300dpi source crops.
function Cat({ src, width, className = "", style }: { src: string; width: number; className?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={width}
      className={`select-none ${className}`}
      style={{ width, height: "auto", ...style }}
    />
  );
}

function CatGutters() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden hidden min-[1100px]:block">
      <div
        className="absolute top-12 flex flex-col items-end gap-6 origin-top-right scale-[0.8] xl:scale-100"
        style={{ right: "calc(50% + 384px + 8px)", width: 180 }}
      >
        <Cat src={catHanging} width={109} />
        <Cat src={catSpiky} width={70} className="self-start" style={{ marginTop: -140 }} />
        <Cat src={catGuitar} width={143} className="self-start mt-4" />
        <Cat src={catLoaf} width={150} className="self-start mt-10" />
        <Cat src={catLongLeft} width={142} className="self-start -mt-2" />
        <Cat src={drawRadio} width={167} className="mt-8" />
        <div className="flex items-end gap-4 self-start">
          <Cat src={drawTopHatBird} width={89} />
          <Cat src={drawStar} width={64} className="mb-24" />
        </div>
        <Cat src={drawBat} width={180} className="mt-4" />
        <Cat src={drawCatCurled} width={168} className="self-start mt-6" />
        <Cat src={drawSnail} width={172} className="mt-4" />
        <div className="flex items-start gap-3 self-start mt-4">
          <Cat src={drawFox} width={117} />
          <Cat src={drawHeart} width={38} className="mt-16" />
        </div>
        <Cat src={drawDog} width={180} className="mt-8" />
      </div>

      <div
        className="absolute top-8 flex flex-col items-start gap-8 origin-top-left scale-[0.8] xl:scale-100"
        style={{ left: "calc(50% + 384px + 8px)", width: 180 }}
      >
        <Cat src={catArched} width={165} />
        <Cat src={catLongRight} width={158} />
        <div className="flex items-start gap-3">
          <Cat src={catSitting} width={74} className="mt-2" />
          <Cat src={catUpsideDown} width={94} />
        </div>
        <div className="flex items-start gap-2 mt-4">
          <Cat src={catSmallSitting} width={81} />
          <Cat src={catStretching} width={102} className="mt-10" />
        </div>
        <div className="flex flex-col items-start gap-5 mt-4">
          <div className="flex items-start gap-4">
            <Cat src={drawBear} width={100} />
            <Cat src={drawMoon} width={54} className="mt-2" />
          </div>
          <Cat src={drawCatLeaping} width={150} />
          <div className="flex items-end gap-3">
            <Cat src={drawCatTall} width={128} />
            <Cat src={drawSquiggle} width={40} className="mb-16" />
          </div>
          <div className="flex items-end gap-5">
            <Cat src={drawBird} width={90} />
            <Cat src={drawCarrot} width={58} />
          </div>
          <div className="flex items-start gap-2">
            <Cat src={drawGiraffe} width={120} />
            <Cat src={drawSpiral} width={58} className="mt-4" />
          </div>
          <div className="flex items-end gap-2">
            <Cat src={drawPartyCat} width={118} />
            <Cat src={drawPig} width={70} className="mb-2" />
          </div>
          <div className="flex items-end gap-3">
            <Cat src={drawBunny} width={95} />
            <Cat src={drawWorm} width={78} />
          </div>
          <Cat src={drawCatLying} width={130} />
        </div>
      </div>
    </div>
  );
}

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
        </div>
      </header>

      <div className="relative">
      <CatGutters />
      <main className="relative px-4 md:px-8 py-10 md:py-14 max-w-3xl mx-auto w-full">
        <div className="relative">
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-black/15" />

          <ol className="flex flex-col gap-8 md:gap-10">
            {timeline.map((project) => (
              <li key={`${project.date}-${project.title}`} className="relative pl-8 md:pl-10">
                <span className="absolute left-0 top-2.5 size-[11px] rounded-full bg-[#fafaf8] border-2 border-black" />

                <a
                  href={project.href}
                  {...(project.href.startsWith("http") && {
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
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
                </a>
              </li>
            ))}
          </ol>
        </div>
      </main>
      </div>

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
          <img
            src={madeBy}
            alt="made by =(cat)="
            draggable={false}
            className="mt-3 h-7 w-auto select-none opacity-80"
          />
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
