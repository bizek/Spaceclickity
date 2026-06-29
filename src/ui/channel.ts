// Hold-to-channel interaction (Expansion P1). Replaces the discrete tap.
// Press-and-hold over the center channels Energy continuously; intensity ramps
// up over a short spin-up and decays on release. UI owns the gesture + ramp and
// emits channel intents; sim/ owns the Energy math. The transient ramp is mirrored
// to render/channeling.ts so the scene can draw the inflow.

import { balance } from "../data/balance.ts";
import { channel } from "../sim/actions.ts";
import { channeling } from "../render/channeling.ts";
import { audio } from "../services/audio.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";

// Apply accumulated channel Energy at ~20 Hz (not every rAF frame) so we don't
// fire 60 store emits/sec through every HUD subscriber.
const FLUSH_INTERVAL = 0.05;

export function mountChannel(zone: HTMLElement, store: Store<GameState>): void {
  let holding = false;
  let intensity = 0;
  let raf = 0;
  let last = 0;
  let acc = 0;

  function loop(now: number): void {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    // Spin up while held, decay a touch faster on release.
    if (holding) {
      intensity = Math.min(1, intensity + dt / balance.channelRampSeconds);
    } else {
      intensity = Math.max(0, intensity - dt / (balance.channelRampSeconds * 0.6));
    }
    channeling.active = holding;
    channeling.intensity = intensity;

    acc += dt;
    if (intensity > 0 && acc >= FLUSH_INTERVAL) {
      const span = acc;
      acc = 0;
      store.update((s) => channel(s, span, intensity));
    }

    if (holding || intensity > 0) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = 0;
      acc = 0;
    }
  }

  function start(): void {
    if (holding) return;
    holding = true;
    zone.classList.add("is-channeling");
    audio.cue("tap");
    if (raf === 0) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  }

  function stop(): void {
    if (!holding) return;
    holding = false;
    zone.classList.remove("is-channeling");
  }

  zone.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (zone.setPointerCapture !== undefined) {
      try {
        zone.setPointerCapture(e.pointerId);
      } catch {
        // capture is best-effort
      }
    }
    start();
  });
  zone.addEventListener("pointerup", stop);
  zone.addEventListener("pointercancel", stop);
  zone.addEventListener("pointerleave", stop);

  // Keyboard a11y: hold Space/Enter to channel.
  zone.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      start();
    }
  });
  zone.addEventListener("keyup", (e) => {
    if (e.key === " " || e.key === "Enter") stop();
  });
}
