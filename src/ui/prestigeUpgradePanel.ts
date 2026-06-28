// Permanent (Entropy) upgrade panel (BALANCING §7). Meta progression that
// accelerates the next run. UI reads state & emits intents through the store.

import { prestigeUpgrades, type PrestigeUpgradeDef } from "../data/prestigeUpgrades.ts";
import { buyPrestigeUpgrade, prestigeUpgradeCost } from "../sim/prestige.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";
import { format } from "../util/format.ts";

interface UpgradeRow {
  def: PrestigeUpgradeDef;
  level: HTMLElement;
  buy: HTMLButtonElement;
}

export function mountPrestigeUpgradePanel(
  parent: HTMLElement,
  store: Store<GameState>,
): void {
  const section = document.createElement("div");
  section.className = "prestige-panel";
  const title = document.createElement("h2");
  title.className = "hud-panel-title";
  title.textContent = "ATTRACTOR";
  section.append(title);
  parent.append(section);

  const rows: UpgradeRow[] = [];

  for (const def of prestigeUpgrades) {
    const row = document.createElement("div");
    row.className = "prestige-row";

    const name = document.createElement("div");
    name.className = "prestige-name";
    name.textContent = def.name;

    const desc = document.createElement("div");
    desc.className = "prestige-desc";
    desc.textContent = def.description;

    const level = document.createElement("div");
    level.className = "prestige-level";

    const buy = document.createElement("button");
    buy.className = "gen-buy";
    buy.addEventListener("click", () => {
      store.update((s) => void buyPrestigeUpgrade(s, def.id));
    });

    row.append(name, desc, level, buy);
    section.append(row);
    rows.push({ def, level, buy });
  }

  store.subscribe((state) => {
    const notation = state.settings.notation;
    for (const row of rows) {
      const lvl = state.prestigeUpgrades[row.def.id] ?? 0;
      row.level.textContent = `Lv ${lvl}`;
      const cost = prestigeUpgradeCost(row.def, lvl);
      row.buy.textContent = `Buy — ${format(cost, notation)}`;
      row.buy.disabled = state.entropy.lt(cost);
    }
  });
}
