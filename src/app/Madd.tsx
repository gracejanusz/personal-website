import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { queries } from "./maddQueries";
import { type Chapter, chapters, lineByQuery } from "./maddStory";
import { getAudio, playSound } from "./maddSound";
import MaddIntro from "./MaddIntro";
import MaddEnding from "./MaddEnding";
import HelpButton from "./HelpButton";
import { CLEAR_AT, fieldValue, fields, summary } from "./maddProfile";
import MaddRadio from "./MaddRadio";
import MaddRats, { type RatRun } from "./MaddRats";
import { songByQuery, songs } from "./maddRadioAudio";

const MUSIC_COLOR = "200,185,255";
const TOTAL_LINES = chapters.reduce((n, c) => n + c.lines.length, 0);

// Render resolution for a clarity from 0 (a few dozen blocky pixels across) to 1
// (full sharpness)
function pixelRatioFor(clarity: number) {
  const full = Math.min(window.devicePixelRatio, 2);
  const min = 0.035;
  return min * Math.pow(full / min, clarity);
}

export default function Madd() {
  const mountRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  // Story lines found so far, keyed like "garage:2", and the most recent one
  const [revealed, setRevealed] = useState<Record<string, true>>({});
  const [latest, setLatest] = useState<string | null>(null);
  const chapterFound = (c: Chapter) => c.lines.some((_, i) => revealed[`${c.id}:${i}`]);
  // He starts as a blocky, blurred figure and sharpens as more lines are found
  const foundCount = Object.keys(revealed).length;
  // Once every line is found, the ending pop-up opens after a pause (only once)
  const [ending, setEnding] = useState<"waiting" | "open" | "closed">("waiting");
  const storyComplete = foundCount === TOTAL_LINES;
  useEffect(() => {
    if (!storyComplete || ending !== "waiting") return;
    const t = window.setTimeout(() => setEnding("open"), 4000);
    return () => window.clearTimeout(t);
  }, [storyComplete, ending]);
  const clarity = Math.min(1, foundCount / CLEAR_AT);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  // Music searches clicked so far; each one unlocks a song on the radio
  const [unlockedSongs, setUnlockedSongs] = useState<string[]>([]);
  // Gerbils currently running across the screen
  const [gerbils, setGerbils] = useState<RatRun[]>([]);
  const fadeTimer = useRef<number | undefined>(undefined);
  const storyRef = useRef<HTMLElement>(null);

  const openSearch = (q: string) => {
    if (songByQuery.has(q)) {
      // Create the audio context inside the click so the radio is allowed to play
      getAudio();
      setUnlockedSongs((u) => (u.includes(q) ? u : [...u, q]));
    }
    const line = lineByQuery.get(q);
    if (!line) return;
    const { chapter, key } = line;
    if (chapter.id === "gerbils") {
      const run = { id: Date.now(), top: 86 + Math.random() * 5, reverse: Math.random() < 0.5 };
      setGerbils((g) => [...g, run]);
    }
    setRevealed((r) => ({ ...r, [key]: true }));
    setLatest(key);
    setActive(chapter.id);
    window.clearTimeout(fadeTimer.current);
    fadeTimer.current = window.setTimeout(() => setActive(null), 7000);
    if (!muted) playSound(chapter.sound);
  };
  useEffect(() => () => window.clearTimeout(fadeTimer.current), []);

  // No scrolling the list underneath while the intro is up
  useEffect(() => {
    document.body.style.overflow = introDone ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [introDone]);

  // Keep the newest line in view once the story outgrows the panel
  useEffect(() => {
    if (!latest) return;
    storyRef.current
      ?.querySelector(`[data-line="${latest}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [latest]);

  useEffect(() => {
    const mount = mountRef.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(pixelRatioFor(0));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.style.imageRendering = "pixelated";
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;

    const camera = new THREE.PerspectiveCamera(35, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    // Drag him to orbit. Only the area around him is grabbable, and zoom is
    // off so the mouse wheel keeps scrolling the query list.
    const controls = new OrbitControls(camera, handleRef.current!);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    let dragging = false;
    controls.addEventListener("start", () => (dragging = true));
    controls.addEventListener("end", () => (dragging = false));

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffe6f0, 1.5);
    rim.position.set(-4, 2, -4);
    scene.add(rim);

    const pivot = new THREE.Group();
    scene.add(pivot);

    new GLTFLoader().load("/models/madd/scene.gltf", (gltf) => {
      const model = gltf.scene;
      // Center the model and scale it to a consistent size
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = 2.2 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale);
      model.position.copy(center.multiplyScalar(-scale));
      // Mute his texture colors: 1 = original, 0 = grayscale
      const SATURATION = 0;
      model.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mat = obj.material as THREE.MeshStandardMaterial;
        mat.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <map_fragment>",
            `#include <map_fragment>
            float lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
            diffuseColor.rgb = mix(vec3(lum), diffuseColor.rgb, ${SATURATION.toFixed(2)});`,
          );
        };
      });
      pivot.add(model);
    });

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = clock.getDelta();
      if (!dragging) pivot.rotation.y += dt * 0.3;
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      rendererRef.current = null;
      mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    const mount = mountRef.current;
    if (!renderer || !mount) return;
    renderer.setPixelRatio(pixelRatioFor(clarity));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
  }, [clarity]);

  return (
    <div className="min-h-screen bg-black py-6 font-mono text-white">
      {!introDone && <MaddIntro onEnter={() => setIntroDone(true)} />}
      <HelpButton />
      {/* Scrolling search log behind him */}
      <table className="w-full border-collapse text-left text-sm sm:text-base">
        <tbody>
          {queries.map((row, i) => {
            const line = lineByQuery.get(row.q);
            const found = line && revealed[line.key];
            const song = songByQuery.has(row.q);
            const clickable = line || song;
            const color = found ? line.chapter.color : song && unlockedSongs.includes(row.q) ? MUSIC_COLOR : null;
            return (
              <tr
                key={i}
                onClick={() => openSearch(row.q)}
                onKeyDown={(e) => e.key === "Enter" && openSearch(row.q)}
                tabIndex={clickable ? 0 : undefined}
                className={`hover:bg-white hover:text-black ${clickable ? "cursor-pointer" : ""}`}
              >
                <td
                  className="whitespace-nowrap py-3 pl-4 pr-6 align-top sm:pl-8"
                  style={color ? { color: `rgb(${color})` } : undefined}
                >
                  {row.time}
                </td>
                <td className="w-full py-3 pr-4">{row.q}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Loose rats scurry along the floor, far behind him */}
      {gerbils.length > 0 && (
        <MaddRats runs={gerbils} onDone={(id) => setGerbils((all) => all.filter((g) => g.id !== id))} />
      )}
      {/* Soft glow behind the model; tinted by the chapter last opened */}
      {[{ id: null, color: "255,225,240" }, ...chapters].map((c) => (
        <div
          key={c.id ?? "base"}
          className="pointer-events-none fixed left-1/2 top-1/2 h-[85vh] w-[45vh] -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-[2000ms]"
          style={{
            opacity: active === c.id ? 1 : 0,
            background: `radial-gradient(ellipse, rgba(${c.color},0.22) 0%, rgba(${c.color},0.09) 35%, rgba(0,0,0,0) 70%)`,
            filter: "blur(20px)",
          }}
        />
      ))}
      <div
        ref={mountRef}
        className="pointer-events-none fixed inset-0 transition-[filter] duration-[2000ms]"
        style={{ filter: `blur(${((1 - clarity) * 5).toFixed(2)}px)` }}
      />
      <div
        ref={handleRef}
        className="fixed left-1/2 top-1/2 h-[80vh] w-[30vh] -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
      />

      {/* The case file: every field starts unknown and fills in as lines are found */}
      <dl className="fixed inset-x-4 top-4 bg-black/80 p-3 font-mono text-[11px] leading-snug sm:inset-x-auto sm:right-[22.5rem] sm:top-6 sm:w-56 sm:bg-transparent sm:p-0 sm:mix-blend-difference">
        {fields.map((f) => {
          const value = fieldValue(f, foundCount);
          return (
            <div key={f.label} className="mb-2 grid grid-cols-[6.5rem_1fr] gap-x-2 sm:block">
              <dt className="uppercase tracking-widest text-neutral-500">{f.label}</dt>
              <dd key={value ?? "?"} className={value ? "madd-fade text-white" : "text-neutral-600"}>
                {value ?? f.unknown}
              </dd>
            </div>
          );
        })}
        {foundCount >= summary.at && <p className="madd-fade mt-4 font-sans text-xs text-neutral-300">{summary.text}</p>}
      </dl>

      {ending === "open" && <MaddEnding onClose={() => setEnding("closed")} />}

      {/* The story so far, assembled in timeline order */}
      {Object.keys(revealed).length > 0 && (
        <aside ref={storyRef} className={`fixed inset-x-0 bottom-0 max-h-[40vh] overflow-y-auto bg-black/85 px-4 py-5 font-sans text-sm leading-relaxed sm:inset-x-auto sm:right-6 ${unlockedSongs.length ? "sm:bottom-48" : "sm:bottom-10"} sm:top-6 sm:max-h-none sm:w-80 sm:bg-transparent sm:px-6 sm:mix-blend-difference`}>
          {chapters
            .filter(chapterFound)
            .map((c) => (
              <section key={c.id} className="mb-6 last:mb-0">
                <h2 className="madd-fade mb-2 font-mono text-xs uppercase tracking-widest" style={{ color: `rgb(${c.color})` }}>
                  {c.title}
                </h2>
                {c.lines.map(
                  (line, i) =>
                    revealed[`${c.id}:${i}`] && (
                      <p key={i} data-line={`${c.id}:${i}`} className="madd-fade mb-2 text-neutral-200">
                        {line.text}
                      </p>
                    ),
                )}
              </section>
            ))}
        </aside>
      )}
      <style>{`
        .madd-fade { animation: madd-fade 1.6s ease-out both; }
        @keyframes madd-fade { from { opacity: 0; filter: blur(4px); } to { opacity: 1; filter: blur(0); } }
      `}</style>

      <button
        onClick={() => setMuted((m) => !m)}
        className="fixed bottom-3 left-4 font-sans text-[10px] text-neutral-600 hover:text-neutral-400"
      >
        {muted ? "sound off" : "sound on"}
      </button>
      {unlockedSongs.length > 0 && (
        <MaddRadio
          unlocked={songs.filter((s) => unlockedSongs.includes(s.query)).sort((a, b) => unlockedSongs.indexOf(a.query) - unlockedSongs.indexOf(b.query))}
          muted={muted}
        />
      )}
      <p className="fixed bottom-3 right-4 font-sans text-[10px] text-neutral-700">
        <a
          href="https://sketchfab.com/3d-models/floral-island-casual-51b345a5ab5843b3b69bfc45056797f7"
          target="_blank"
          rel="noreferrer"
          className="hover:text-neutral-500"
        >
          "Floral Island Casual" by restore50, CC BY 4.0
        </a>
        {chapterFound(chapters.find((c) => c.id === "gerbils")!) && (
          <>
            {" · "}
            <a
              href="https://sketchfab.com/3d-models/rat-gnmg3nm-2d6d571e56444023ab8e32a8d94a1bed"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-500"
            >
              "Rat (GNM/G3NM)" by Iskaa1874, CC BY 4.0
            </a>
          </>
        )}
        {unlockedSongs.length > 0 && (
          <>
            {" · "}
            <a
              href="https://sketchfab.com/3d-models/radio--russia-303-122e81af079648f5b1e9cf7b61582fc8"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-500"
            >
              "Radio_ Russia_303" by SOKOL250, CC BY 4.0
            </a>
          </>
        )}
      </p>
    </div>
  );
}
