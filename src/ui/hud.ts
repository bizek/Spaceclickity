// DOM overlay shell (VISUAL_SPEC §7 + Expansion E1 console reskin).
// Cold, scientific, restrained — now framed as a multi-panel command console.
// UI reads state & emits intents; it never mutates currencies (separation is
// sacred). The center column is always left clear for the WebGL universe.

import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";
import { format } from "../util/format.ts";
import { deriveNegentropy, deriveScale } from "../sim/derive.ts";
import { energyPerSecond } from "../sim/production.ts";
import { tap } from "../sim/actions.ts";
import { createPanel } from "./console/panel.ts";
import { mountConsoleFrame } from "./console/frame.ts";
import { mountTierPanel } from "./tierPanel.ts";
import { mountGeneratorPanel } from "./generatorPanel.ts";
import { mountUpgradePanel } from "./upgradePanel.ts";
import { mountPrestigeUpgradePanel } from "./prestigeUpgradePanel.ts";
import { mountConsumeButton } from "./consumeButton.ts";
import { mountCycleLog } from "./cycleLog.ts";
import { mountNotifications } from "./notifications.ts";
import { mountSettingsPanel } from "./settingsPanel.ts";
import { comparisonIndexFor, comparisons } from "../data/comparisons.ts";
import { audio } from "../services/audio.ts";

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mountHud(
  root: HTMLElement,
  store: Store<GameState>,
  onConsume: () => void,
): void {
  root.innerHTML = "";

  // --- Chrome layer: brackets, grid, scanlines. Behind the panels, above the
  //     canvas, never interactive. Inserted as a sibling before #hud. ---
  const frame = mountConsoleFrame(store);
  root.parentElement?.insertBefore(frame, root);

  // --- Top bar: Entropy (meta hero) · entity name · settings ---
  const topBar = el("header", "hud-topbar");
  const entropyReadout = el("div", "hud-entropy");
  const entityName = el("div", "hud-entity", "the Attractor");
  const settingsBtn = el("button", "hud-settings", "⚙");
  settingsBtn.setAttribute("aria-label", "Settings");
  const settings = mountSettingsPanel(store);
  settingsBtn.addEventListener("click", () => settings.open());
  topBar.append(entropyReadout, entityName, settingsBtn);

  // --- Center: tap-to-channel hit area over the canvas ---
  const tapArea = el("button", "hud-tap", "tap to channel Energy");
  tapArea.setAttribute("aria-label", "Channel Energy");

  // --- Left dock: the Complexity ladder as a console subsystem panel ---
  const leftDock = el("div", "console-dock console-left");
  const complexity = createPanel({ id: "complexity", title: "COMPLEXITY" });
  mountTierPanel(complexity.body, store);
  leftDock.append(complexity.root);

  // --- Right dock: stacked readout / production / meta panels ---
  const rightDock = el("div", "console-dock console-right");

  const readoutPanel = createPanel({ id: "readout", title: "READOUT" });
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
  const comparisonLine = el("p", "hud-comparison");
  readoutPanel.body.append(readout, comparisonLine);

  const genPanel = createPanel({ id: "generators", title: "GENERATORS" });
  mountGeneratorPanel(genPanel.body, store);
  mountUpgradePanel(genPanel.body, store);

  const attractorPanel = createPanel({ id: "attractor", title: "ATTRACTOR" });
  mountPrestigeUpgradePanel(attractorPanel.body, store);

  rightDock.append(readoutPanel.root, genPanel.root, attractorPanel.root);

  // --- Bottom-left: cycle count + fact-unlock progress ---
  const cycleArea = el("footer", "hud-cycle");
  mountCycleLog(cycleArea, store);

  // --- Bottom-right: the weighty Consume action ---
  const consumeArea = el("div", "hud-consume");
  mountConsumeButton(consumeArea, store, onConsume);

  root.append(topBar, tapArea, leftDock, rightDock, cycleArea, consumeArea);

  // Quiet slide-in popups for fact unlocks + Scale comparisons.
  mountNotifications(store);

  // Reactive bindings for the live readouts.
  store.subscribe((state) => {
    const notation = state.settings.notation;
    const scale = deriveScale(state as GameState);
    entropyReadout.textContent = `ENTROPY: ${format(state.entropy, notation)}`;
    energyV.textContent = format(state.energy, notation);
    rateV.textContent = format(energyPerSecond(state as GameState), notation);
    scaleV.textContent = format(scale, notation);
    negV.textContent = format(deriveNegentropy(state as GameState), notation);

    const ci = comparisonIndexFor(scale.toNumber());
    comparisonLine.textContent = ci >= 0 ? (comparisons[ci]?.text ?? "") : "";
  });

  // Tap-to-channel: emit the tap intent; sim/ owns the actual Energy math.
  tapArea.addEventListener("click", () => {
    store.update((state) => tap(state));
    audio.cue("tap");
  });
}
