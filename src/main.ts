// Bootstrap (TECH_ARCHITECTURE §8): load state, init the three decoupled
// systems (sim / render / UI), wire autosave. Keep this thin — it only wires.

import "./style.css";
import { balance } from "./data/balance.ts";
import { Store } from "./state/store.ts";
import type { GameState } from "./state/schema.ts";
import { loadGame, saveGame } from "./util/save.ts";
import { startSimulation } from "./sim/tick.ts";
import { initScene } from "./render/scene.ts";
import { consume, previewEntropyGain } from "./sim/prestige.ts";
import { applyOfflineProgress } from "./sim/offline.ts";
import { mountHud } from "./ui/hud.ts";
import { notify } from "./ui/notifications.ts";
import { format, formatDuration } from "./util/format.ts";
import { audio } from "./services/audio.ts";
import { leaderboard } from "./services/leaderboard.ts";

function bootstrap(): void {
  const canvas = document.querySelector<HTMLCanvasElement>("#scene");
  const hudRoot = document.querySelector<HTMLElement>("#hud");
  if (canvas === null || hudRoot === null) {
    throw new Error("Missing #scene or #hud mount points in index.html");
  }

  // GAME STATE — single source of truth.
  const store = new Store<GameState>(loadGame());

  // OFFLINE PROGRESS — fast-forward production for time away, before anything
  // subscribes so the first render already reflects the catch-up.
  const offline = applyOfflineProgress(store.get() as GameState);

  // SIMULATION — fixed-timestep, FPS-independent.
  startSimulation(store);

  // RENDER — Three.js scene; reads state only. Held mutably so a quality change
  // can rebuild it live (particle counts / bloom are set at init).
  let scene = initScene(canvas, store);

  // AUDIO — bind the sound setting to the cue service; react to changes.
  audio.setEnabled(store.get().settings.sound);
  let prevQuality = store.get().settings.quality;
  let prevSound = store.get().settings.sound;
  store.subscribe((state) => {
    if (state.settings.sound !== prevSound) {
      prevSound = state.settings.sound;
      audio.setEnabled(prevSound);
    }
    if (state.settings.quality !== prevQuality) {
      prevQuality = state.settings.quality;
      scene.stop();
      scene = initScene(canvas, store);
    }
  });

  // Consume intent: play the devour FX, then apply the prestige under cover of
  // the fade. Skippable after the first viewing if the player opts in.
  function requestConsume(): void {
    if (scene.isConsuming()) return;
    const state = store.get() as GameState;
    if (previewEntropyGain(state).lte(0)) return;
    const skip = state.settings.skipConsumeFX && state.seenConsumeFX;
    scene.playConsume(() => {
      store.update((s) => {
        consume(s);
        s.seenConsumeFX = true;
      });
      saveGame(store.get() as GameState); // persist on this key event
      void leaderboard.submitScore(store.get().entropy.toString());
    }, skip);
  }

  // UI — DOM overlay shell; subscribes to state, emits intents.
  mountHud(hudRoot, store, requestConsume);

  // Eerie AFK summary — "the Attractor was patient."
  if (offline !== null && offline.gained.gt(0)) {
    const notation = store.get().settings.notation;
    const tail = offline.capped ? " (the Attractor was patient only so long)" : "";
    notify(
      "AFK",
      "The Attractor was patient",
      `Away ${formatDuration(offline.seconds)}. The universe yielded ${format(offline.gained, notation)} Energy${tail}.`,
    );
  }

  // Submit the starting standing (covers offline gains / first load).
  void leaderboard.submitScore(store.get().entropy.toString());

  // PERSISTENCE — autosave on interval and on key lifecycle events.
  setInterval(() => {
    store.update((state) => {
      state.lastSaved = Date.now();
    });
    saveGame(store.get() as GameState);
    void leaderboard.submitScore(store.get().entropy.toString());
  }, balance.autosaveIntervalMs);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      saveGame(store.get() as GameState);
    }
  });
}

bootstrap();
