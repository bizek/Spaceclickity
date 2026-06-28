// Generator purchase panel (TECH_ARCHITECTURE §3, BALANCING §2).
// UI reads state & emits intents through the store; it never mutates currencies.

import Decimal from "break_infinity.js";
import { generators, type GeneratorDef } from "../data/generators.ts";
import { buyGenerator, costForN, maxAffordable } from "../sim/actions.ts";
import type { GameState } from "../state/schema.ts";
import type { Store } from "../state/store.ts";
import { format } from "../util/format.ts";

interface GeneratorRow {
  def: GeneratorDef;
  container: HTMLElement;
  count: HTMLElement;
  buyOne: HTMLButtonElement;
  buyMax: HTMLButtonElement;
}

export function mountGeneratorPanel(parent: HTMLElement, store: Store<GameState>): void {
  const section = document.createElement("div");
  section.className = "gen-panel";
  section.append(makeTitle("GENERATORS"));
  parent.append(section);

  const rows: GeneratorRow[] = [];

  for (const def of generators) {
    const row = document.createElement("div");
    row.className = "gen-row";

    const name = document.createElement("div");
    name.className = "gen-name";
    name.textContent = def.name;

    const count = document.createElement("div");
    count.className = "gen-count";

    const buttons = document.createElement("div");
    buttons.className = "gen-buttons";

    const buyOne = document.createElement("button");
    buyOne.className = "gen-buy";
    buyOne.addEventListener("click", () => {
      store.update((s) => {
        buyGenerator(s, def.id, 1);
      });
    });

    const buyMax = document.createElement("button");
    buyMax.className = "gen-buy";
    buyMax.addEventListener("click", () => {
      const s = store.get();
      const owned = s.generators[def.id] ?? 0;
      const k = maxAffordable(def, owned, s.energy);
      if (k > 0) store.update((st) => void buyGenerator(st, def.id, k));
    });

    buttons.append(buyOne, buyMax);
    row.append(name, count, buttons);
    section.append(row);
    rows.push({ def, container: row, count, buyOne, buyMax });
  }

  store.subscribe((state) => {
    const notation = state.settings.notation;
    for (const row of rows) {
      // Hide generators whose tier isn't unlocked yet.
      const tierUnlocked = (state.tierLevels[row.def.requiresTier] ?? 0) > 0;
      row.container.style.display = tierUnlocked ? "" : "none";
      if (!tierUnlocked) continue;

      const owned = state.generators[row.def.id] ?? 0;
      const perUnit = new Decimal(row.def.baseProduction);
      row.count.textContent = `×${owned} · +${format(perUnit.mul(owned), notation)}/s`;

      const oneCost = costForN(row.def, owned, 1);
      row.buyOne.textContent = `Buy ×1 — ${format(oneCost, notation)}`;
      row.buyOne.disabled = state.energy.lt(oneCost);

      const k = maxAffordable(row.def, owned, state.energy);
      const maxCost = costForN(row.def, owned, k);
      row.buyMax.textContent = k > 0 ? `Buy ×${k} — ${format(maxCost, notation)}` : "Buy ×—";
      row.buyMax.disabled = k <= 0;
    }
  });
}

function makeTitle(text: string): HTMLElement {
  const h = document.createElement("h2");
  h.className = "hud-panel-title";
  h.textContent = text;
  return h;
}
