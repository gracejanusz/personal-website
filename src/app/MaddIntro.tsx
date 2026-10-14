import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const FALL_MS = 1900;

// Opening screen for /madd: the old family computer, alone and still. Hovering it
// makes it glow; clicking it falls the camera into its screen, then hands off to
// the page behind.
export default function MaddIntro({ onEnter }: { onEnter: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const fallRef = useRef<() => void>(() => {});
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;
  const [hovered, setHovered] = useState(false);
  const [falling, setFalling] = useState(false);
  const [leaving, setLeaving] = useState(false);

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
    scene.environmentIntensity = 0.5;

    const camera = new THREE.PerspectiveCamera(30, mount.clientWidth / mount.clientHeight, 0.01, 100);
    const startPos = new THREE.Vector3(0, 0.9, 6);
    const startLook = new THREE.Vector3(0, -0.1, 0);
    camera.position.copy(startPos);
    camera.lookAt(startLook);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-3, 4, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfd8ff, 1.2);
    rim.position.set(4, 2, -3);
    scene.add(rim);

    const pivot = new THREE.Group();
    scene.add(pivot);
    const screenCenter = new THREE.Vector3();

    new GLTFLoader().load("/models/xp/scene.gltf", (gltf) => {
      const model = gltf.scene;
      // Center and scale, then turn it to face the viewer, slightly angled
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = 2.4 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale);
      model.position.copy(center.multiplyScalar(-scale));
      pivot.add(model);
      pivot.rotation.y = -Math.PI / 2 + 0.2;
      pivot.updateMatrixWorld(true);
      // The monitor glass is the plain black material; that's where we fall in
      model.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material.name === "Material.002") {
          new THREE.Box3().setFromObject(obj).getCenter(screenCenter);
        }
      });
    });

    // Hover and click only count when the pointer is actually on the computer
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hitsComputer = (e: PointerEvent | MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(pivot, true).length > 0;
    };

    let fallStart = 0;
    const startFall = () => {
      if (fallStart || !pivot.children.length) return;
      fallStart = performance.now();
      setFalling(true);
    };
    fallRef.current = startFall;

    const onMove = (e: PointerEvent) => {
      if (!fallStart) setHovered(hitsComputer(e));
    };
    const onClick = (e: MouseEvent) => {
      if (hitsComputer(e)) startFall();
    };
    const onLeave = () => setHovered(false);
    mount.addEventListener("pointermove", onMove);
    mount.addEventListener("pointerleave", onLeave);
    mount.addEventListener("click", onClick);

    const lookAt = new THREE.Vector3();
    const end = new THREE.Vector3();
    let handedOff = false;
    let handoffTimer: number | undefined;
    renderer.setAnimationLoop(() => {
      if (fallStart) {
        const t = Math.min((performance.now() - fallStart) / FALL_MS, 1);
        // Ease in, so it starts as a lean and ends as a drop into the glass
        const k = t * t * t;
        end.copy(screenCenter).lerp(startPos, 0.01);
        camera.position.lerpVectors(startPos, end, k);
        lookAt.lerpVectors(startLook, screenCenter, Math.min(t * 2, 1));
        camera.lookAt(lookAt);
        if (t > 0.97 && !handedOff) {
          handedOff = true;
          setLeaving(true);
          handoffTimer = window.setTimeout(() => onEnterRef.current(), 900);
        }
      }
      renderer.render(scene, camera);
    });

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", resize);

    return () => {
      renderer.setAnimationLoop(null);
      window.clearTimeout(handoffTimer);
      window.removeEventListener("resize", resize);
      mount.removeEventListener("pointermove", onMove);
      mount.removeEventListener("pointerleave", onLeave);
      mount.removeEventListener("click", onClick);
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black transition-opacity duration-[900ms] ${leaving ? "opacity-0" : "opacity-100"}`}
    >
      <h1
        className={`pointer-events-none absolute inset-x-0 top-[12vh] text-center font-mono text-3xl font-normal text-white transition-opacity duration-700 sm:text-5xl ${falling ? "opacity-0" : "opacity-100"}`}
      >
        who are you?
      </h1>
      {/* Glow behind the computer, shown on hover */}
      <div
        className="pointer-events-none absolute left-1/2 top-[60vh] h-[60vmin] w-[85vmin] -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-500"
        style={{
          opacity: hovered && !falling ? 1 : 0,
          background:
            "radial-gradient(ellipse, rgba(255,240,250,0.22) 0%, rgba(255,200,230,0.09) 35%, rgba(0,0,0,0) 70%)",
          filter: "blur(20px)",
        }}
      />
      <div
        ref={mountRef}
        role="button"
        tabIndex={0}
        aria-label="Enter the computer"
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fallRef.current()}
        className={`absolute inset-x-0 bottom-0 top-[20vh] outline-none ${hovered && !falling ? "cursor-pointer" : ""}`}
      />
      <a
        href="https://sketchfab.com/3d-models/windows-xp-computer-a61b737405cf4213956a296e980d1e0c"
        target="_blank"
        rel="noreferrer"
        className={`absolute bottom-3 right-4 font-sans text-[10px] text-neutral-700 transition-opacity hover:text-neutral-500 ${falling ? "opacity-0" : ""}`}
      >
        "Windows XP Computer" by Vertex Mercher, CC BY 4.0
      </a>
    </div>
  );
}
