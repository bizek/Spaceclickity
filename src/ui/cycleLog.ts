// Cycle count + fact-unlock progress (VISUAL_SPEC §7, GAME_DESIGN §9).
// Scaffold shows the live cycle/fact tally; the eerie fact log opens in M7.

import { facts } from "../data/facts.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";

export function mountCycleLog(parent: HTMLElement, store: Store<GameState>): void {
  const label = document.createElement("span");
  label.className = "cycle-label";
  parent.append(label);

  store.subscribe((state) => {
    const unlocked = state.unlockedFacts.length;
    label.textContent = `cycle ${state.cycle} · facts (${unlocked}/${facts.length})`;
  });
}
