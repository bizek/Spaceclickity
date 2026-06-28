// Cycle count + fact-unlock progress, click to open the re-readable log
// (GAME_DESIGN §9, VISUAL_SPEC §7). A quiet running tally of consumed universes.

import { comparisonIndexFor, comparisons } from "../data/comparisons.ts";
import { facts } from "../data/facts.ts";
import { deriveScale } from "../sim/derive.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";

export function mountCycleLog(parent: HTMLElement, store: Store<GameState>): void {
  const button = document.createElement("button");
  button.className = "cycle-label";
  button.setAttribute("aria-haspopup", "dialog");
  parent.append(button);

  const overlay = buildLogOverlay(store);
  document.body.append(overlay.root);

  button.addEventListener("click", () => overlay.open());

  store.subscribe((state) => {
    const unlocked = state.unlockedFacts.length;
    button.textContent = `cycle ${state.cycle} · facts (${unlocked}/${facts.length})`;
  });
}

function buildLogOverlay(store: Store<GameState>): {
  root: HTMLElement;
  open: () => void;
} {
  const root = document.createElement("div");
  root.className = "log-overlay";
  root.hidden = true;

  const panel = document.createElement("div");
  panel.className = "log-panel";
  root.append(panel);

  const close = (): void => {
    root.hidden = true;
  };
  root.addEventListener("click", (e) => {
    if (e.target === root) close();
  });

  const open = (): void => {
    render();
    root.hidden = false;
  };

  function render(): void {
    const state = store.get();
    panel.innerHTML = "";

    const header = document.createElement("div");
    header.className = "log-header";
    const h = document.createElement("h2");
    h.className = "hud-panel-title";
    h.textContent = "THE CYCLE LOG";
    const x = document.createElement("button");
    x.className = "popup-close";
    x.textContent = "×";
    x.addEventListener("click", close);
    header.append(h, x);
    panel.append(header);

    const tally = document.createElement("p");
    tally.className = "log-tally";
    tally.textContent = `Universes consumed: ${state.cycle - 1}. Currently growing cycle ${state.cycle}.`;
    panel.append(tally);

    const ci = comparisonIndexFor(deriveScale(state as GameState).toNumber());
    if (ci >= 0) {
      const comp = document.createElement("p");
      comp.className = "log-comparison";
      comp.textContent = comparisons[ci]?.text ?? "";
      panel.append(comp);
    }

    const list = document.createElement("div");
    list.className = "log-facts";
    // Show in canonical (data) order; locked entries are redacted.
    for (const fact of facts) {
      const unlocked = state.unlockedFacts.includes(fact.id);
      const entry = document.createElement("div");
      entry.className = `log-fact ${unlocked ? "" : "is-redacted"}`;
      const t = document.createElement("div");
      t.className = "log-fact-title";
      t.textContent = unlocked ? fact.title : "— — —";
      const b = document.createElement("div");
      b.className = "log-fact-body";
      b.textContent = unlocked
        ? fact.body
        : "Not yet observed.";
      entry.append(t, b);
      list.append(entry);
    }
    panel.append(list);
  }

  return { root, open };
}
