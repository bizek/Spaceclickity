// Universe Survey panel (Expansion E2, COMMAND_CONSOLE.md §Universe Survey).
// A faux-scan readout of the current universe: era, dominant structure, scale,
// classification, and — once life exists — a lifesign line. Pure read-only
// flavor (Pillar P2). Content lives in data/survey.ts.

import { tiers } from "../data/tiers.ts";
import { surveyByEra } from "../data/survey.ts";
import { getArchetype } from "../data/galaxies.ts";
import { deriveScale } from "../sim/derive.ts";
import { comparisonIndexFor, comparisons } from "../data/comparisons.ts";
import { format } from "../util/format.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";

/** Highest unlocked tier = the universe's current era. */
function currentEra(state: GameState): (typeof tiers)[number] {
  let era = tiers[0]!;
  for (const tier of tiers) {
    if ((state.tierLevels[tier.id] ?? 0) > 0) era = tier;
  }
  return era;
}

function line(parent: HTMLElement, key: string): HTMLElement {
  const row = document.createElement("div");
  row.className = "survey-line";
  const k = document.createElement("span");
  k.className = "survey-key";
  k.textContent = key;
  const v = document.createElement("span");
  v.className = "survey-val";
  row.append(k, v);
  parent.append(row);
  return v;
}

export function mountSurveyPanel(parent: HTMLElement, store: Store<GameState>): void {
  const wrap = document.createElement("div");
  wrap.className = "survey";
  parent.append(wrap);

  const status = document.createElement("div");
  status.className = "survey-status";
  status.textContent = "▮ SCANNING ";
  wrap.append(status);

  // Target galaxy header: name + morphology, then an eerie blurb and the boon.
  const galaxyName = document.createElement("div");
  galaxyName.className = "survey-galaxy-name";
  wrap.append(galaxyName);
  const galaxyBlurb = document.createElement("div");
  galaxyBlurb.className = "survey-galaxy-blurb";
  wrap.append(galaxyBlurb);
  const galaxyBoon = document.createElement("div");
  galaxyBoon.className = "survey-galaxy-boon";
  wrap.append(galaxyBoon);

  const eraV = line(wrap, "ERA");
  const structureV = line(wrap, "STRUCTURE");
  const scaleV = line(wrap, "SCALE");
  const classV = line(wrap, "CLASS");
  classV.classList.add("survey-class");

  const lifesign = document.createElement("div");
  lifesign.className = "survey-lifesign";
  lifesign.hidden = true;
  wrap.append(lifesign);

  store.subscribe((state) => {
    const era = currentEra(state as GameState);
    const entry = surveyByEra[era.visualKey];
    const notation = state.settings.notation;
    const scale = deriveScale(state as GameState);

    const archetype = getArchetype(state.galaxy.archetypeId);
    galaxyName.textContent = `${state.galaxy.name} · ${archetype.morphologyName}`;
    galaxyBlurb.textContent = archetype.blurb;
    galaxyBoon.textContent = archetype.modifier.label;

    eraV.textContent = era.name;
    structureV.textContent = entry.structure;
    scaleV.textContent = format(scale, notation);

    classV.textContent = entry.classification;
    classV.classList.toggle("is-redacted", entry.redacted === true);

    const ci = comparisonIndexFor(scale.toNumber());
    if (ci >= 0) {
      const cmp = comparisons[ci]?.text;
      if (cmp !== undefined) structureV.title = cmp; // tooltip detail
    }

    if (entry.lifesign !== undefined) {
      lifesign.hidden = false;
      lifesign.textContent = entry.lifesign;
    } else {
      lifesign.hidden = true;
    }
  });
}
