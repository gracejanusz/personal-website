import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

export type RatRun = { id: number; top: number; reverse: boolean };

const RAT_LENGTH = 58; // px, nose to tail; small, so it reads as far away
const TOP_SPEED = 520; // px per second

// Each run is a list of legs: scurry to a point (as a fraction of screen width),
// or stop for a while. Rats move in bursts, so there are a couple of short stops
// and one long one in the middle where it sits and sniffs.
type Leg = { to: number } | { wait: number };
const ROUTE: Leg[] = [{ to: 0.2 }, { wait: 0.35 }, { to: 0.46 }, { wait: 1.6 }, { to: 0.62 }, { wait: 0.25 }, { to: 1.08 }];

type Rat = {
  run: RatRun;
  obj: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  runAction: THREE.AnimationAction;
  idleAction: THREE.AnimationAction;
  x: number; // px from the left edge of the screen
  leg: number;
  legTime: number;
  running: boolean;
};

// Full-screen transparent overlay that renders every loose rat at once.
export default function MaddRats({ runs, onDone }: { runs: RatRun[]; onDone: (id: number) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runsRef = useRef(runs);
  runsRef.current = runs;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const mount = mountRef.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.7;
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-200, 400, 500);
    scene.add(key);

    // Orthographic camera in screen pixels: x to the right, y down (negated)
    const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -2000, 2000);
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.right = w;
      camera.bottom = -h;
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener("resize", resize);

    let gltf: GLTF | null = null;
    let scale = 1;
    const rats = new Map<number, Rat>();

    new GLTFLoader().load("/models/rat/scene.gltf", (loaded) => {
      gltf = loaded;
      const size = new THREE.Box3().setFromObject(loaded.scene).getSize(new THREE.Vector3());
      scale = RAT_LENGTH / Math.max(size.x, size.y, size.z);
    });

    const spawn = (run: RatRun) => {
      const obj = cloneSkinned(gltf!.scene);
      obj.scale.setScalar(scale);
      // Model runs along +z; turn it to run sideways across the screen, tipped
      // slightly toward the viewer so it reads as 3D
      const holder = new THREE.Group();
      holder.add(obj);
      holder.rotation.x = 0.35;
      obj.rotation.y = run.reverse ? -Math.PI / 2 : Math.PI / 2;
      scene.add(holder);
      const mixer = new THREE.AnimationMixer(obj);
      const clip = (name: string) => THREE.AnimationClip.findByName(gltf!.animations, name)!;
      const runAction = mixer.clipAction(clip("run-inplace"));
      const idleAction = mixer.clipAction(clip("idle"));
      runAction.play();
      idleAction.play();
      idleAction.setEffectiveWeight(0);
      rats.set(run.id, {
        run,
        obj: holder,
        mixer,
        runAction,
        idleAction,
        x: -RAT_LENGTH,
        leg: 0,
        legTime: 0,
        running: true,
      });
    };

    const setRunning = (rat: Rat, running: boolean) => {
      if (rat.running === running) return;
      rat.running = running;
      const [from, to] = running ? [rat.idleAction, rat.runAction] : [rat.runAction, rat.idleAction];
      to.reset().setEffectiveWeight(1).play();
      from.crossFadeTo(to, 0.15, false);
    };

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const w = window.innerWidth;
      if (gltf) for (const run of runsRef.current) if (!rats.has(run.id)) spawn(run);

      for (const rat of rats.values()) {
        const leg = ROUTE[rat.leg];
        rat.legTime += dt;
        if ("wait" in leg) {
          setRunning(rat, false);
          if (rat.legTime >= leg.wait) {
            rat.leg++;
            rat.legTime = 0;
          }
        } else {
          setRunning(rat, true);
          const target = leg.to * w;
          const remaining = target - rat.x;
          // Snap up to speed, then brake hard just before the stop
          const speed = TOP_SPEED * Math.min(1, rat.legTime / 0.12) * Math.min(1, Math.max(remaining / 70, 0.25));
          rat.x = Math.min(target, rat.x + speed * dt);
          rat.runAction.timeScale = 0.6 + 0.6 * (speed / TOP_SPEED);
          if (rat.x >= target) {
            rat.leg++;
            rat.legTime = 0;
          }
        }
        rat.mixer.update(dt);
        const screenX = rat.run.reverse ? w - rat.x : rat.x;
        rat.obj.position.set(screenX, -(rat.run.top / 100) * window.innerHeight, 0);

        if (rat.leg >= ROUTE.length) {
          scene.remove(rat.obj);
          rats.delete(rat.run.id);
          onDoneRef.current(rat.run.id);
        }
      }
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // Dimmed and slightly hazy, like it's across the room
  return <div ref={mountRef} className="pointer-events-none fixed inset-0" style={{ opacity: 0.8, filter: "blur(0.5px) brightness(0.75)" }} />;
}
