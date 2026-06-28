// Complexity tier ladder panel (VISUAL_SPEC §7). Buy / owned / locked states.
// Scaffold renders the ladder read-only from tiers.ts; buy intents land in M3.

import { tiers } from "../data/tiers.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";

export function mountTierPanel(parent: HTMLElement, store: Store<GameState>): void {
  const list = document.createElement("ul");
  list.className = "tier-list";
  parent.append(list);

  store.subscribe((state) => {
    list.innerHTML = "";
    for (const tier of tiers) {
      const owned = (state.tierLevels[tier.id] ?? 0) > 0;
      const item = document.createElement("li");
      item.className = `tier-row ${owned ? "is-owned" : "is-locked"}`;
      item.textContent = `▸ ${tier.name}`;
      const status = document.createElement("span");
      status.className = "tier-status";
      status.textContent = owned ? "✓" : "locked";
      item.append(status);
      list.append(item);
    }
  });
}
