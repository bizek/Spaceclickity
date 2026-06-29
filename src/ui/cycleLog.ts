// Cycle count + fact-unlock progress, click to open the re-readable log
// (GAME_DESIGN §9, VISUAL_SPEC §7). A quiet running tally of consumed universes.

import { comparisonIndexFor, comparisons } from "../data/comparisons.ts";
import { facts, type FactDef } from "../data/facts.ts";
import { tiers } from "../data/tiers.ts";
import { deriveScale } from "../sim/derive.ts";
import { hasUnlock } from "../sim/disciplines.ts";
import { leaderboard } from "../services/leaderboard.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";
import { format } from "../util/format.ts";
import Decimal from "break_infinity.js";

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
    tally.textContent = `Galaxies consumed: ${state.cycle - 1}. Currently growing cycle ${state.cycle}.`;
    panel.append(tally);

    // Standing — total Entropy (the Attractor's vastness). Local leaderboard.
    const standing = document.createElement("p");
    standing.className = "log-tally";
    const notation = state.settings.notation;
    standing.textContent = `The Attractor's vastness (Entropy): ${format(state.entropy, notation)}`;
    panel.append(standing);
    void leaderboard.getGlobal().then((board) => {
      const best = board[0];
      if (best !== undefined && new Decimal(best.entropy).gt(state.entropy)) {
        standing.textContent += ` — best ${format(new Decimal(best.entropy), notation)}`;
      }
    });

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
      // Echoes (factHint) surfaces how to reach each unobserved fact.
      const hinting = !unlocked && hasUnlock(state as GameState, "factHint");
      b.textContent = unlocked
        ? fact.body
        : hinting
          ? factHintText(fact, state.settings.notation)
          : "Not yet observed.";
      if (hinting) entry.classList.add("is-hinted");
      entry.append(t, b);
      list.append(entry);
    }
    panel.append(list);
  }

  return { root, open };
}

/** A discreet hint at how an unobserved fact is triggered (Mind: Echoes). */
function factHintText(fact: FactDef, notation: GameState["settings"]["notation"]): string {
  switch (fact.trigger.kind) {
    case "tier-reached": {
      const tierId = fact.trigger.tierId;
      const name = tiers.find((t) => t.id === tierId)?.name;
      return `Echo: reach the ${name ?? "next"} tier.`;
    }
    case "scale-threshold":
      return `Echo: grow Scale beyond ${format(new Decimal(fact.trigger.scale), notation)}.`;
    case "cycle-count":
      return `Echo: consume ${fact.trigger.cycles} galaxies.`;
  }
}
