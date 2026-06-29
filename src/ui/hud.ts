// DOM overlay shell (VISUAL_SPEC §7 + Expansion E1 console reskin).
// Cold, scientific, restrained — now framed as a multi-panel command console.
// UI reads state & emits intents; it never mutates currencies (separation is
// sacred). The center column is always left clear for the WebGL universe.

import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";
import { format } from "../util/format.ts";
import { deriveNegentropy, deriveScale } from "../sim/derive.ts";
import { energyPerSecond } from "../sim/production.ts";
import { mountChannel } from "./channel.ts";
import { createPanel } from "./console/panel.ts";
import { mountConsoleFrame } from "./console/frame.ts";
import { shouldSkipBoot, playBoot } from "./console/boot.ts";
import { mountTierPanel } from "./tierPanel.ts";
import { mountTelemetryPanel } from "./telemetryPanel.ts";
import { mountSurveyPanel } from "./surveyPanel.ts";
import { mountGeneratorPanel } from "./generatorPanel.ts";
import { mountUpgradePanel } from "./upgradePanel.ts";
import { mountDisciplines } from "./disciplinePanel.ts";
import { mountConsumeButton } from "./consumeButton.ts";
import { mountCycleLog } from "./cycleLog.ts";
import { mountNotifications } from "./notifications.ts";
import { mountSettingsPanel } from "./settingsPanel.ts";
import { comparisonIndexFor, comparisons } from "../data/comparisons.ts";
import { hasUnlock } from "../sim/disciplines.ts";

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
  const { frame, statusEl } = mountConsoleFrame(store);
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

  // --- Center: hold-to-channel hit area over the canvas ---
  const channelZone = el("button", "hud-channel");
  channelZone.setAttribute("aria-label", "Hold to channel Energy into the galaxy");
  channelZone.append(el("span", "hud-channel-hint", "hold to channel"));

  // --- Left dock: Complexity ladder + sensor instruments (telemetry/survey).
  //     Telemetry/Survey are E2; E3 will gate them behind Mind discipline nodes. ---
  const leftDock = el("div", "console-dock console-left");
  const complexity = createPanel({ id: "complexity", title: "COMPLEXITY" });
  mountTierPanel(complexity.body, store);
  const telemetry = createPanel({ id: "telemetry", title: "TELEMETRY" });
  mountTelemetryPanel(telemetry.body, store);
  const survey = createPanel({ id: "survey", title: "GALAXY SURVEY" });
  mountSurveyPanel(survey.body, store);
  leftDock.append(complexity.root, telemetry.root, survey.root);

  // Telemetry & Survey are unlocked by Mind discipline nodes (panelUnlock); the
  // "all" param (Total Recall) reveals everything. Hidden until earned (E5).
  const gatePanel = (root: HTMLElement, panelId: string): void => {
    store.subscribe((s) => {
      const unlocked =
        hasUnlock(s as GameState, "panelUnlock", panelId) ||
        hasUnlock(s as GameState, "panelUnlock", "all");
      root.hidden = !unlocked;
    });
  };
  gatePanel(telemetry.root, "telemetry");
  gatePanel(survey.root, "survey");

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
  // Revealed early by the Mind "Clear Optics" node (revealComparisons).
  const comparisonNext = el("p", "hud-comparison-next");
  readoutPanel.body.append(readout, comparisonLine, comparisonNext);

  const genPanel = createPanel({ id: "generators", title: "GENERATORS" });
  mountGeneratorPanel(genPanel.body, store);
  mountUpgradePanel(genPanel.body, store);

  // The ATTRACTOR prestige upgrades are now the root nodes of the Matter/Hunger
  // trees; this panel launches the discipline overlay (E3).
  const disciplinesPanel = createPanel({ id: "disciplines", title: "DISCIPLINES" });
  mountDisciplines(disciplinesPanel.body, store);

  rightDock.append(readoutPanel.root, genPanel.root, disciplinesPanel.root);

  // --- Bottom-left: cycle count + fact-unlock progress ---
  const cycleArea = el("footer", "hud-cycle");
  mountCycleLog(cycleArea, store);

  // --- Bottom-right: the weighty Consume action ---
  const consumeArea = el("div", "hud-consume");
  mountConsumeButton(consumeArea, store, onConsume);

  root.append(topBar, channelZone, leftDock, rightDock, cycleArea, consumeArea);

  // Boot sequence: stagger-reveal visible panels on first load. gatePanel
  // subscribers fire synchronously (store.subscribe fires immediately), so
  // .hidden flags are settled before we reach this point.
  {
    const allPanels = [
      complexity.root, telemetry.root, survey.root,     // left dock, top→bottom
      readoutPanel.root, genPanel.root, disciplinesPanel.root, // right dock
    ];
    const visiblePanels = allPanels.filter((p) => !p.hidden);
    const state = store.get();
    if (!shouldSkipBoot(state.settings)) {
      playBoot(visiblePanels, statusEl);
    }
  }

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

    if (hasUnlock(state as GameState, "revealComparisons")) {
      const next = comparisons[ci + 1];
      comparisonNext.textContent = next !== undefined ? `next ▸ ${next.text}` : "";
    } else {
      comparisonNext.textContent = "";
    }
  });

  // Hold-to-channel: the gesture + ramp live in ui/channel.ts; sim/ owns the math.
  mountChannel(channelZone, store);
}
