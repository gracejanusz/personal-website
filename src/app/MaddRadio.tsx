import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { type Song, setRadioMuted, tuneTo } from "./maddRadioAudio";

// Bottom-right radio. It starts playing the first song as soon as it appears,
// and each click tunes to the next unlocked song, looping back around.
export default function MaddRadio({ unlocked, muted }: { unlocked: Song[]; muted: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [station, setStation] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Pulse whenever a new station unlocks
  useEffect(() => {
    if (!unlocked.length) return;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 2400);
    return () => window.clearTimeout(t);
  }, [unlocked.length]);

  useEffect(() => setRadioMuted(muted), [muted]);
  useEffect(() => {
    tuneTo(unlocked[0]);
    return () => tuneTo(null);
    // Only on first appearance; later unlocks just add stations
  }, []);

  useEffect(() => {
    const mount = mountRef.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 1;
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    const key = new THREE.DirectionalLight(0xffffff, 3.5);
    key.position.set(-2, 3, 4);
    scene.add(key);

    const camera = new THREE.PerspectiveCamera(30, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.5, 5);
    camera.lookAt(0, 0, 0);

    new GLTFLoader().load("/models/radio/scene.gltf", (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = 2.2 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale);
      model.position.copy(center.multiplyScalar(-scale));
      const pivot = new THREE.Group();
      pivot.add(model);
      pivot.rotation.y = -Math.PI / 2 + 0.35;
      scene.add(pivot);
      renderer.render(scene, camera);
    });

    return () => {
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  const next = () => {
    const n = (station + 1) % unlocked.length;
    setStation(n);
    tuneTo(unlocked[n]);
  };

  const playing = unlocked[station];

  return (
    <div className="madd-fade fixed bottom-8 right-4 z-10 flex flex-col items-center">
      <button
        onClick={next}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`Radio: ${playing.freq}. Change station`}
        className="relative h-28 w-36 transition-transform duration-150 active:scale-95"
      >
        {/* Warm, flickering firelight glow; a little brighter on hover or a new unlock */}
        <div
          className="pointer-events-none absolute -inset-8 transition-opacity duration-500"
          style={{ opacity: hovered || pulse ? 1 : 0.7 }}
        >
          <div
            className="madd-flicker h-full w-full rounded-full"
            style={{
              background:
                "radial-gradient(ellipse, rgba(255,190,90,0.55) 0%, rgba(255,130,40,0.2) 40%, rgba(0,0,0,0) 70%)",
              filter: "blur(12px)",
            }}
          />
        </div>
        <div ref={mountRef} className="absolute inset-0" />
      </button>
      <p className="mt-1 max-w-48 truncate text-center font-mono text-[11px] text-neutral-400">
        {pulse && unlocked.length > 1 ? "new station" : `${playing.freq}  ${playing.query}`}
      </p>
      <style>{`
        .madd-flicker { animation: madd-flicker 3.2s ease-in-out infinite; }
        @keyframes madd-flicker {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          18% { opacity: 1; transform: scale(1.04); }
          32% { opacity: 0.75; transform: scale(0.98); }
          47% { opacity: 0.95; transform: scale(1.02); }
          63% { opacity: 0.7; transform: scale(0.99); }
          80% { opacity: 1; transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
