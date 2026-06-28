// Fact-unlock + Scale-comparison popups (GAME_DESIGN §9, VISUAL_SPEC §7).
// Slide in quietly, dismissible, auto-fade; also drives sound cues. Watches
// state for change — UI reads state only, never mutates it.

import { comparisonIndexFor, comparisons } from "../data/comparisons.ts";
import { facts } from "../data/facts.ts";
import { audio } from "../services/audio.ts";
import { deriveScale } from "../sim/derive.ts";
import type { GameState } from "../state/schema.ts";
import type { Store } from "../state/store.ts";

const factById = new Map(facts.map((f) => [f.id, f]));

export function mountNotifications(store: Store<GameState>): void {
  const container = document.createElement("div");
  container.className = "popups";
  document.body.append(container);

  let seenFacts: Set<string> | null = null;
  let prevComparison = -2;
  let prevCycle = -1;

  store.subscribe((state) => {
    // Initialize baselines from the loaded state so we don't spam on load.
    if (seenFacts === null) {
      seenFacts = new Set(state.unlockedFacts);
      prevComparison = comparisonIndexFor(deriveScale(state as GameState).toNumber());
      prevCycle = state.cycle;
      return;
    }

    // New fact unlocks.
    for (const id of state.unlockedFacts) {
      if (seenFacts.has(id)) continue;
      seenFacts.add(id);
      const fact = factById.get(id);
      if (fact !== undefined) {
        showPopup(container, "FACT UNLOCKED", fact.title, fact.body);
        audio.cue("unlock");
      }
    }

    // Scale comparison advanced.
    const ci = comparisonIndexFor(deriveScale(state as GameState).toNumber());
    if (ci > prevComparison) {
      prevComparison = ci;
      const c = comparisons[ci];
      if (c !== undefined) {
        showPopup(container, "SCALE", "", c.text);
        audio.cue("milestone");
      }
    }

    // Cycle advanced (Consume happened).
    if (state.cycle > prevCycle) {
      prevCycle = state.cycle;
      audio.cue("consume");
    }
  });
}

function showPopup(
  container: HTMLElement,
  kind: string,
  title: string,
  body: string,
): void {
  const card = document.createElement("div");
  card.className = "popup";

  const k = document.createElement("div");
  k.className = "popup-kind";
  k.textContent = kind;

  const close = document.createElement("button");
  close.className = "popup-close";
  close.setAttribute("aria-label", "Dismiss");
  close.textContent = "×";

  const dismiss = (): void => {
    card.classList.add("is-leaving");
    window.setTimeout(() => card.remove(), 300);
  };
  close.addEventListener("click", dismiss);

  card.append(k, close);
  if (title !== "") {
    const t = document.createElement("div");
    t.className = "popup-title";
    t.textContent = title;
    card.append(t);
  }
  const b = document.createElement("div");
  b.className = "popup-body";
  b.textContent = body;
  card.append(b);

  container.append(card);
  requestAnimationFrame(() => card.classList.add("is-in"));
  window.setTimeout(dismiss, 9000); // auto-dismiss; logged for re-reading
}
