// Three.js scene orchestrator (TECH_ARCHITECTURE §8, VISUAL_SPEC §1).
// Locked, slowly auto-orbiting perspective camera + pointer parallax; bloom via
// EffectComposer. Drives the central universe, starfields, and the Attractor
// from state each frame. Render reads state only — never game logic.

import {
  Color,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";
import { Universe } from "./universe.ts";
import { Starfield } from "./particles.ts";
import { Attractor } from "./attractor.ts";
import { ConsumeFX } from "./consumeFX.ts";

export interface SceneHandle {
  stop(): void;
  /** Play the devour animation; `onApply` performs the actual prestige. */
  playConsume(onApply: () => void, skip: boolean): void;
  /** Whether a Consume animation is currently running. */
  isConsuming(): boolean;
}

const BLOOM_BY_QUALITY = {
  low: { strength: 0.6, radius: 0.3 },
  medium: { strength: 0.8, radius: 0.4 },
  high: { strength: 1.0, radius: 0.5 },
} as const;

const PIXEL_RATIO_BY_QUALITY = {
  low: 1,
  medium: 1.25,
  high: 1.5,
} as const;

/** Render cap; an idle game has no need to run above this. */
const TARGET_FPS = 60;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

export function initScene(
  canvas: HTMLCanvasElement,
  store: Store<GameState>,
): SceneHandle {
  const quality = store.get().settings.quality;
  const reducedMotionInitial = store.get().settings.reducedMotion;

  const renderer = new WebGLRenderer({ canvas, antialias: quality !== "low", powerPreference: "high-performance" });
  // Cap device pixel ratio: bloom + additive particles are fill-rate bound, so on
  // high-DPI displays rendering at 2x can quadruple GPU cost for little gain.
  const maxPixelRatio = PIXEL_RATIO_BY_QUALITY[quality];
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
  // Bloom is blurry by nature, so it can render at a fraction of canvas res.
  const bloomScale = quality === "high" ? 0.6 : 0.5;

  const scene = new Scene();
  scene.background = new Color(0x05060a);

  const camera = new PerspectiveCamera(50, 1, 0.1, 2000);
  camera.position.set(0, 0, 6);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomCfg = BLOOM_BY_QUALITY[quality];
  const bloom = new UnrealBloomPass(new Vector2(1, 1), bloomCfg.strength, bloomCfg.radius, 0.1);
  composer.addPass(bloom);

  const universe = new Universe(scene, quality);
  const starfield = new Starfield(scene, quality);
  const attractor = new Attractor(scene);

  // Pointer parallax (normalized -1..1), eased toward the target each frame.
  const pointerTarget = new Vector2(0, 0);
  const pointer = new Vector2(0, 0);
  function onPointerMove(e: PointerEvent): void {
    pointerTarget.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  }
  window.addEventListener("pointermove", onPointerMove);

  function resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.setSize(Math.round(w * bloomScale), Math.round(h * bloomScale));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  let activeFX: ConsumeFX | null = null;
  const flashEl = document.getElementById("fx");

  let raf = 0;
  let last = performance.now();
  let lastRender = last;
  let elapsed = 0;

  function frame(now: number): void {
    raf = requestAnimationFrame(frame);

    // Throttle to TARGET_FPS — caps GPU work (and heat/fan) on fast displays.
    if (now - lastRender < FRAME_INTERVAL_MS - 0.5) return;
    lastRender = now;

    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    elapsed += dt;

    const state = store.get() as GameState;
    const reducedMotion = state.settings.reducedMotion || reducedMotionInitial;

    pointer.lerp(pointerTarget, 1 - Math.exp(-dt * 4));

    // Slow auto-orbit + pointer parallax on the camera.
    const orbit = reducedMotion ? 0 : Math.sin(elapsed * 0.05) * 0.6;
    camera.position.x = Math.sin(orbit) * 6 + pointer.x * 0.6;
    camera.position.y = pointer.y * -0.4;
    camera.position.z = Math.cos(orbit) * 6;
    camera.lookAt(0, 0, 0);

    // While the Consume FX runs it owns the universe group transform.
    if (activeFX !== null) {
      if (!activeFX.update(dt)) activeFX = null;
    } else {
      universe.update(state, dt, elapsed, reducedMotion);
    }
    starfield.update(dt, elapsed, pointer.x, pointer.y, reducedMotion);
    attractor.update(state, dt);

    composer.render();
  }
  raf = requestAnimationFrame(frame);

  return {
    stop() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      composer.dispose();
      renderer.dispose();
    },
    playConsume(onApply: () => void, skip: boolean): void {
      if (activeFX !== null) return;
      if (flashEl === null) {
        onApply();
        return;
      }
      activeFX = new ConsumeFX(universe, attractor, camera, flashEl, onApply, skip);
    },
    isConsuming(): boolean {
      return activeFX !== null;
    },
  };
}
