// Three.js scene bootstrap (TECH_ARCHITECTURE §8, VISUAL_SPEC §1).
// Milestone 1: a blank, correctly-sized, resizing canvas with the locked,
// slow-orbit perspective camera and the near-black cosmic background.
// Central object, parallax starfields, nebula, and bloom land in milestone 5.
// Render reads state only — never game logic, never currency mutation.

import {
  Color,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";

export interface SceneHandle {
  stop(): void;
}

export function initScene(
  canvas: HTMLCanvasElement,
  _store: Store<GameState>,
): SceneHandle {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new Scene();
  scene.background = new Color(0x05060a); // near-black, faint indigo

  const camera = new PerspectiveCamera(50, 1, 0.1, 1000);
  camera.position.set(0, 0, 6);
  camera.lookAt(0, 0, 0);

  function resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  let raf = 0;

  function frame(): void {
    // Milestone 5: compute dt here to drive central object + camera auto-orbit.
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    stop() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}
