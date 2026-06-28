// Fixed-timestep simulation loop (TECH_ARCHITECTURE §3).
// Decoupled from render FPS: accumulate real elapsed time, step in fixed
// increments so production is FPS-independent. Uses setInterval (not rAF) so
// the sim keeps running when the tab is backgrounded.

import { balance } from "../data/balance.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";
import { step } from "./production.ts";

export interface SimHandle {
  stop(): void;
}

export function startSimulation(store: Store<GameState>): SimHandle {
  const dtSeconds = balance.simTickMs / 1000;
  let last = performance.now();
  let accumulator = 0;

  const id = window.setInterval(() => {
    const now = performance.now();
    accumulator += now - last;
    last = now;

    let steps = 0;
    // Cap catch-up steps per wake so a long pause can't freeze the thread.
    while (accumulator >= balance.simTickMs && steps < 1000) {
      store.update((state) => step(state, dtSeconds));
      accumulator -= balance.simTickMs;
      steps += 1;
    }
  }, balance.simTickMs);

  return {
    stop() {
      window.clearInterval(id);
    },
  };
}
