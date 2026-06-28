// Fact-unlock detection (GAME_DESIGN §9). Game logic — lives in sim/.
// Evaluates every fact's trigger against state each tick and records newly met
// ones. The UI watches `unlockedFacts` growth to pop notifications.

import { facts } from "../data/facts.ts";
import type { GameState } from "../state/schema.ts";
import { deriveScale } from "./derive.ts";

export function checkFactUnlocks(state: GameState): void {
  let scale: number | null = null; // computed lazily, once

  for (const fact of facts) {
    if (state.unlockedFacts.includes(fact.id)) continue;

    let met = false;
    switch (fact.trigger.kind) {
      case "tier-reached":
        met = (state.tierLevels[fact.trigger.tierId] ?? 0) > 0;
        break;
      case "scale-threshold":
        if (scale === null) scale = deriveScale(state).toNumber();
        met = scale >= fact.trigger.scale;
        break;
      case "cycle-count":
        met = state.cycle >= fact.trigger.cycles;
        break;
    }

    if (met) state.unlockedFacts.push(fact.id);
  }
}
