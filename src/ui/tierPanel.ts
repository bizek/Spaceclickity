// Complexity tier ladder panel (VISUAL_SPEC §7). Buy / owned / locked states.
// UI reads state & emits the unlock intent; sim/ owns the Energy math.

import { tiers } from "../data/tiers.ts";
import { effectiveUnlockCost, nextUnlockableTier, unlockTier } from "../sim/actions.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";
import { format } from "../util/format.ts";

interface TierRow {
  id: string;
  /** Shown for owned (✓) / locked rows. */
  text: HTMLElement;
  /** Persistent unlock button — created once, never recreated (see below). */
  btn: HTMLButtonElement;
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

    // Build the interactive elements ONCE. The subscribe callback runs on every
    // state change (Energy ticks ~10x/s), so recreating the button there would
    // destroy the DOM node mid-click and swallow the click. Instead we keep one
    // persistent button + text node per row and only mutate their contents.
    const text = document.createElement("span");
    const btn = document.createElement("button");
    btn.className = "tier-buy";
    btn.addEventListener("click", () => {
      store.update((s) => void unlockTier(s, tier.id));
    });
    status.append(text, btn);

    item.append(label, status);
    list.append(item);
    rows.push({ id: tier.id, text, btn });
  }

  store.subscribe((state) => {
    const next = nextUnlockableTier(state);
    const notation = state.settings.notation;

    for (const row of rows) {
      const owned = (state.tierLevels[row.id] ?? 0) > 0;
      const isNext = next !== undefined && next.id === row.id;

      const li = row.text.closest("li");
      if (li !== null) {
        li.className = `tier-row ${owned ? "is-owned" : isNext ? "is-next" : "is-locked"}`;
      }

      if (owned) {
        row.text.textContent = "✓";
        row.text.hidden = false;
        row.btn.hidden = true;
        continue;
      }
      if (isNext) {
        const cost = effectiveUnlockCost(state, next);
        row.btn.textContent = `unlock — ${format(cost, notation)}`;
        row.btn.disabled = state.energy.lt(cost);
        row.btn.hidden = false;
        row.text.hidden = true;
        continue;
      }
      row.text.textContent = "locked";
      row.text.hidden = false;
      row.btn.hidden = true;
    }
  });
}
