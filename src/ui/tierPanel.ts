// Complexity tier ladder panel (VISUAL_SPEC §7). Buy / owned / locked states.
// UI reads state & emits the unlock intent; sim/ owns the Energy math.

import { tiers } from "../data/tiers.ts";
import { effectiveUnlockCost, nextUnlockableTier, unlockTier } from "../sim/actions.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";
import { format } from "../util/format.ts";

interface TierRow {
  id: string;
  status: HTMLElement;
}

export function mountTierPanel(parent: HTMLElement, store: Store<GameState>): void {
  const list = document.createElement("ul");
  list.className = "tier-list";
  parent.append(list);

  const rows: TierRow[] = [];

  for (const tier of tiers) {
    const item = document.createElement("li");
    item.className = "tier-row";

    const label = document.createElement("span");
    label.className = "tier-name";
    label.textContent = `▸ ${tier.name}`;

    const status = document.createElement("span");
    status.className = "tier-status";

    item.append(label, status);
    list.append(item);
    rows.push({ id: tier.id, status });
  }

  store.subscribe((state) => {
    const next = nextUnlockableTier(state);
    const notation = state.settings.notation;

    for (const row of rows) {
      const owned = (state.tierLevels[row.id] ?? 0) > 0;
      const isNext = next !== undefined && next.id === row.id;
      row.status.innerHTML = "";

      const li = row.status.parentElement;
      if (li !== null) {
        li.className = `tier-row ${owned ? "is-owned" : isNext ? "is-next" : "is-locked"}`;
      }

      if (owned) {
        row.status.textContent = "✓";
        continue;
      }
      if (isNext) {
        const cost = effectiveUnlockCost(state, next);
        const btn = document.createElement("button");
        btn.className = "tier-buy";
        btn.textContent = `unlock — ${format(cost, notation)}`;
        btn.disabled = state.energy.lt(cost);
        btn.addEventListener("click", () => {
          store.update((s) => void unlockTier(s, row.id));
        });
        row.status.append(btn);
        continue;
      }
      row.status.textContent = "locked";
    }
  });
}
