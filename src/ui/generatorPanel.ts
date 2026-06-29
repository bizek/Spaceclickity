// Generator purchase panel (TECH_ARCHITECTURE §3, BALANCING §2).
// UI reads state & emits intents through the store; it never mutates currencies.

import Decimal from "break_infinity.js";
import { generators, type GeneratorDef } from "../data/generators.ts";
import { upgradeTracks, type UpgradeTrackId } from "../data/generatorUpgrades.ts";
import {
  buyGenerator,
  buyGeneratorUpgrade,
  effectiveGenCost,
  maxAffordableFor,
} from "../sim/actions.ts";
import { hasUnlock } from "../sim/disciplines.ts";
import {
  generatorUpgradeCost,
  generatorUpgradeLevel,
  pipBandState,
} from "../sim/generatorUpgrades.ts";
import type { GameState } from "../state/schema.ts";
import type { Store } from "../state/store.ts";
import { format } from "../util/format.ts";

interface TrackRow {
  pips: HTMLSpanElement[];
  buyBtn: HTMLButtonElement;
}

interface GeneratorRow {
  def: GeneratorDef;
  container: HTMLElement;
  count: HTMLElement;
  buyOne: HTMLButtonElement;
  buyTen: HTMLButtonElement;
  buyMax: HTMLButtonElement;
  tracks: Map<UpgradeTrackId, TrackRow>;
}

export function mountGeneratorPanel(parent: HTMLElement, store: Store<GameState>): void {
  // Title is owned by the enclosing console panel (see ui/hud.ts).
  const section = document.createElement("div");
  section.className = "gen-panel";
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

    // ×10 is gated behind the Mind "Bulk Channeling" node (bulkBuyUnlock).
    const buyTen = document.createElement("button");
    buyTen.className = "gen-buy";
    buyTen.hidden = true;
    buyTen.addEventListener("click", () => {
      const s = store.get() as GameState;
      const owned = s.generators[def.id] ?? 0;
      const cost = effectiveGenCost(s, def, owned, 10);
      if (s.energy.gte(cost)) store.update((st) => void buyGenerator(st, def.id, 10));
    });

    const buyMax = document.createElement("button");
    buyMax.className = "gen-buy";
    buyMax.addEventListener("click", () => {
      const s = store.get() as GameState;
      const owned = s.generators[def.id] ?? 0;
      const k = maxAffordableFor(s, def, owned, s.energy);
      if (k > 0) store.update((st) => void buyGenerator(st, def.id, k));
    });

    buttons.append(buyOne, buyTen, buyMax);
    row.append(name, count, buttons);

    // --- Pip upgrade tracks ---
    const tracksEl = document.createElement("div");
    tracksEl.className = "gen-tracks";

    const trackMap = new Map<UpgradeTrackId, TrackRow>();

    for (const track of upgradeTracks) {
      const trackRow = document.createElement("div");
      trackRow.className = "gen-track";

      const label = document.createElement("span");
      label.className = "gen-track-label";
      label.title = track.description;
      label.textContent = `${track.symbol} ${track.name}`;

      const pipsEl = document.createElement("span");
      pipsEl.className = "gen-track-pips";
      const pips: HTMLSpanElement[] = [];
      for (let i = 0; i < 5; i++) {
        const pip = document.createElement("span");
        pip.className = "gen-pip";
        pipsEl.append(pip);
        pips.push(pip);
      }

      const buyBtn = document.createElement("button");
      buyBtn.className = "gen-track-buy";
      buyBtn.setAttribute(
        "aria-label",
        `Buy ${track.name} pip for ${def.name}`,
      );
      buyBtn.addEventListener("click", () => {
        store.update((s) => {
          buyGeneratorUpgrade(s, def.id, track.id);
        });
      });

      trackRow.append(label, pipsEl, buyBtn);
      tracksEl.append(trackRow);
      trackMap.set(track.id, { pips, buyBtn });
    }

    row.append(tracksEl);
    section.append(row);
    rows.push({ def, container: row, count, buyOne, buyTen, buyMax, tracks: trackMap });
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

      const oneCost = effectiveGenCost(state as GameState, row.def, owned, 1);
      row.buyOne.textContent = `Buy ×1 — ${format(oneCost, notation)}`;
      row.buyOne.disabled = state.energy.lt(oneCost);

      const bulk = hasUnlock(state as GameState, "bulkBuyUnlock");
      row.buyTen.hidden = !bulk;
      if (bulk) {
        const tenCost = effectiveGenCost(state as GameState, row.def, owned, 10);
        row.buyTen.textContent = `Buy ×10 — ${format(tenCost, notation)}`;
        row.buyTen.disabled = state.energy.lt(tenCost);
      }

      const k = maxAffordableFor(state as GameState, row.def, owned, state.energy);
      const maxCost = effectiveGenCost(state as GameState, row.def, owned, k);
      row.buyMax.textContent = k > 0 ? `Buy ×${k} — ${format(maxCost, notation)}` : "Buy ×—";
      row.buyMax.disabled = k <= 0;

      // Update pip tracks.
      for (const [trackId, trackRow] of row.tracks) {
        const level = generatorUpgradeLevel(state as GameState, row.def.id, trackId);
        const band = pipBandState(level);
        const cost = generatorUpgradeCost(state as GameState, row.def.id, trackId);

        for (let i = 0; i < trackRow.pips.length; i++) {
          const pip = trackRow.pips[i]!;
          const filled = i < band.filledPips;
          pip.classList.toggle("is-filled", filled);
          (pip as HTMLElement).style.background = filled ? band.color : "";
          (pip as HTMLElement).style.borderColor = filled ? band.color : "";
          (pip as HTMLElement).style.boxShadow = filled
            ? `0 0 4px 0 ${band.color}60`
            : "";
        }

        if (band.atMax) {
          trackRow.buyBtn.disabled = true;
          trackRow.buyBtn.textContent = "MAX";
        } else if (cost === null) {
          trackRow.buyBtn.disabled = true;
          trackRow.buyBtn.textContent = "—";
        } else {
          trackRow.buyBtn.disabled = state.energy.lt(cost);
          trackRow.buyBtn.textContent = format(cost, notation);
        }
      }
    }
  });
}
