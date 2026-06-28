// The Consume devour animation (VISUAL_SPEC §4).
// Quiet, inevitable, never gory: a pull → collapse toward the Attractor →
// fade-to-black (state resets under cover) → a new, smaller spark emerges.
// Owns the universe group transform for its duration; the scene suppresses the
// normal universe update while this is active.

import type { PerspectiveCamera } from "three";
import type { Universe } from "./universe.ts";
import type { Attractor } from "./attractor.ts";

const easeInQuad = (t: number): number => t * t;
const easeOutQuad = (t: number): number => 1 - (1 - t) * (1 - t);

export class ConsumeFX {
  private t = 0;
  private readonly duration: number;
  private applied = false;
  private readonly startScale: number;

  constructor(
    private readonly universe: Universe,
    private readonly attractor: Attractor,
    private readonly camera: PerspectiveCamera,
    private readonly flashEl: HTMLElement,
    private readonly onApply: () => void,
    private readonly skip: boolean,
  ) {
    this.duration = skip ? 0.35 : 2.6;
    this.startScale = universe.group.scale.x;
  }

  /** Returns true while the FX is still running. */
  update(dt: number): boolean {
    this.t += dt;
    const p = Math.min(this.t / this.duration, 1);
    const grp = this.universe.group;
    const ax = this.attractor.group.position;

    if (this.skip) {
      this.flashEl.style.opacity = String(p < 0.5 ? p * 2 : (1 - p) * 2);
      this.applyOnce();
      return p < 1;
    }

    if (p < 0.12) {
      // Stillness — peak ripeness, glowing.
      this.flashEl.style.opacity = "0";
    } else if (p < 0.5) {
      // Pull: drift toward the Attractor, contracting, spinning up.
      const k = easeInQuad((p - 0.12) / 0.38);
      grp.position.set(ax.x * 0.4 * k, ax.y * 0.4 * k, ax.z * 0.4 * k);
      grp.scale.setScalar(this.startScale * (1 - 0.5 * k));
      grp.rotation.y += dt * (1 + 6 * k);
    } else if (p < 0.68) {
      // Collapse + cover: drawn away to a point as the dark rises.
      const k = easeInQuad((p - 0.5) / 0.18);
      grp.position.set(ax.x * (0.4 + 0.5 * k), ax.y * (0.4 + 0.5 * k), ax.z * (0.4 + 0.5 * k));
      grp.scale.setScalar(this.startScale * (0.5 - 0.48 * k));
      grp.rotation.y += dt * 7;
      this.flashEl.style.opacity = String(Math.min(1, k * 1.4));
      // Camera leans in slightly for the devouring.
      this.camera.fov = 50 - 4 * k;
      this.camera.updateProjectionMatrix();
      if (k > 0.7) this.applyOnce();
    } else {
      // Fade-to-black lifting: a new, smaller spark at center.
      this.applyOnce();
      const k = easeOutQuad((p - 0.68) / 0.32);
      grp.position.set(0, 0, 0);
      grp.scale.setScalar(0.25 + 0.15 * k);
      this.flashEl.style.opacity = String(Math.max(0, 1 - k));
      this.camera.fov = 46 + 4 * k;
      this.camera.updateProjectionMatrix();
    }

    if (p >= 1) {
      // Hand control back cleanly: origin, default fov, flash cleared.
      grp.position.set(0, 0, 0);
      this.camera.fov = 50;
      this.camera.updateProjectionMatrix();
      this.flashEl.style.opacity = "0";
      return false;
    }
    return true;
  }

  private applyOnce(): void {
    if (this.applied) return;
    this.applied = true;
    this.onApply(); // bank Entropy, advance cycle, reset to Big Bang
    this.attractor.bump(); // the entity sits fractionally larger
  }
}
