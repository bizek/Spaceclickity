// DOM overlay shell (VISUAL_SPEC §7). Cold, scientific, restrained.
// Builds the HUD frame and mounts each panel. UI reads state & emits intents;
// it never mutates currencies (CLAUDE.md: separation is sacred).

import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";
import { format } from "../util/format.ts";
import { deriveNegentropy, deriveScale } from "../sim/derive.ts";
import { energyPerSecond } from "../sim/production.ts";
import { tap } from "../sim/actions.ts";
import { mountTierPanel } from "./tierPanel.ts";
import { mountGeneratorPanel } from "./generatorPanel.ts";
import { mountUpgradePanel } from "./upgradePanel.ts";
import { mountPrestigeUpgradePanel } from "./prestigeUpgradePanel.ts";
import { mountConsumeButton } from "./consumeButton.ts";
import { mountCycleLog } from "./cycleLog.ts";

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mountHud(root: HTMLElement, store: Store<GameState>): void {
  root.innerHTML = "";

  // --- Top bar: Entropy (meta hero) · entity name · settings ---
  const topBar = el("header", "hud-topbar");
  const entropyReadout = el("div", "hud-entropy");
  const entityName = el("div", "hud-entity", "the Attractor");
  const settingsBtn = el("button", "hud-settings", "⚙");
  settingsBtn.setAttribute("aria-label", "Settings");
  topBar.append(entropyReadout, entityName, settingsBtn);

  // --- Center: tap-to-channel hit area over the canvas ---
  const tapArea = el("button", "hud-tap", "tap to channel Energy");
  tapArea.setAttribute("aria-label", "Channel Energy");

  // --- Left: Complexity tier ladder ---
  const leftPanel = el("section", "hud-panel hud-left");
  leftPanel.append(el("h2", "hud-panel-title", "COMPLEXITY"));
  mountTierPanel(leftPanel, store);

  // --- Right: in-run readout (Scale / Energy / Negentropy) + upgrades ---
  const rightPanel = el("section", "hud-panel hud-right");
  rightPanel.append(el("h2", "hud-panel-title", "READOUT"));
  const readout = el("dl", "hud-readout");
  const scaleV = el("dd", "hud-stat-value");
  const energyV = el("dd", "hud-stat-value");
  const rateV = el("dd", "hud-stat-value");
  const negV = el("dd", "hud-stat-value");
  readout.append(
    el("dt", "hud-stat-label", "Scale"),
    scaleV,
    el("dt", "hud-stat-label", "Energy"),
    energyV,
    el("dt", "hud-stat-label", "Energy/s"),
    rateV,
    el("dt", "hud-stat-label", "Negentropy"),
    negV,
  );
  rightPanel.append(readout);
  mountGeneratorPanel(rightPanel, store);
  mountUpgradePanel(rightPanel, store);
  mountPrestigeUpgradePanel(rightPanel, store);

  // --- Bottom-left: cycle count + fact-unlock progress ---
  const cycleArea = el("footer", "hud-cycle");
  mountCycleLog(cycleArea, store);

  // --- Bottom-right: the weighty Consume action ---
  const consumeArea = el("div", "hud-consume");
  mountConsumeButton(consumeArea, store);

  root.append(
    topBar,
    tapArea,
    leftPanel,
    rightPanel,
    cycleArea,
    consumeArea,
  );

  // Reactive bindings for the live readouts.
  store.subscribe((state) => {
    const notation = state.settings.notation;
    entropyReadout.textContent = `ENTROPY: ${format(state.entropy, notation)}`;
    energyV.textContent = format(state.energy, notation);
    rateV.textContent = format(energyPerSecond(state as GameState), notation);
    scaleV.textContent = format(deriveScale(state as GameState), notation);
    negV.textContent = format(
      deriveNegentropy(state as GameState),
      notation,
    );
  });

  // Tap-to-channel: emit the tap intent; sim/ owns the actual Energy math.
  tapArea.addEventListener("click", () => {
    store.update((state) => tap(state));
  });
}
