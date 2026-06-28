// Bootstrap (TECH_ARCHITECTURE §8): load state, init the three decoupled
// systems (sim / render / UI), wire autosave. Keep this thin — it only wires.

import "./style.css";
import { balance } from "./data/balance.ts";
import { Store } from "./state/store.ts";
import type { GameState } from "./state/schema.ts";
import { loadGame, saveGame } from "./util/save.ts";
import { startSimulation } from "./sim/tick.ts";
import { initScene } from "./render/scene.ts";
import { mountHud } from "./ui/hud.ts";

function bootstrap(): void {
  const canvas = document.querySelector<HTMLCanvasElement>("#scene");
  const hudRoot = document.querySelector<HTMLElement>("#hud");
  if (canvas === null || hudRoot === null) {
    throw new Error("Missing #scene or #hud mount points in index.html");
  }

  // GAME STATE — single source of truth.
  const store = new Store<GameState>(loadGame());

  // SIMULATION — fixed-timestep, FPS-independent.
  startSimulation(store);

  // RENDER — blank canvas for now; reads state only.
  initScene(canvas, store);

  // UI — DOM overlay shell; subscribes to state, emits intents.
  mountHud(hudRoot, store);

  // PERSISTENCE — autosave on interval and on key lifecycle events.
  setInterval(() => {
    store.update((state) => {
      state.lastSaved = Date.now();
    });
    saveGame(store.get() as GameState);
  }, balance.autosaveIntervalMs);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      saveGame(store.get() as GameState);
    }
  });
}

bootstrap();
