// Disciplines — passive skill trees (Expansion E3, DISCIPLINES.md).
// Data only: five themed trees of permanent, Entropy-bought nodes. The engine
// (sim/disciplines.ts) interprets `effects`; never inline these numbers in logic.
//
// A node is a sentence in the effect vocabulary (docs/expansion/03-vocabulary.md).
// Scalar effects carry a magnitude (multiplicative ^level); unlock effects are
// booleans. A node may carry several effects (capstones). `requires` are node ids
// (a DAG). `position` lays the node out in the tree panel (grid units).
//
// E3 ships Matter + Hunger (they hold the migrated legacy prestige upgrades).
// Time / Mind / Void arrive in E4 — their ids are reserved in DisciplineId.

export type DisciplineId = "matter" | "hunger" | "time" | "mind" | "void";

export type NodeEffect =
  // production
  | "energyMult"
  | "tapMult"
  | "cheaperTiers"
  | "generatorCostReduction"
  | "tierEnergyMult"
  // conversion / prestige
  | "betterConversion"
  | "negentropyWeightMult"
  | "metaSoftcapRaise"
  | "minRipenessFloor"
  // time / automation (E4)
  | "offlineBoost"
  | "offlineCapHours"
  | "tickRateMult"
  | "autoBuyGenerators"
  // mind / QoL / console (E4)
  | "revealComparisons"
  | "factHint"
  | "bulkBuyUnlock"
  | "panelUnlock"
  // void / capstone
  | "globalMult"
  | "instabilitySynergy"
  | "crossDisciplineMult";

export interface NodeEffectSpec {
  effect: NodeEffect;
  /** Scalar effects: per-level factor. Unlock effects omit this. */
  magnitude?: number;
  /** Effects that need a target (tierEnergyMult tier-group, panelUnlock id). */
  param?: string;
}

export interface NodeDef {
  /** Stable id `<discipline>.<slug>` — used in save data. */
  id: string;
  name: string;
  description: string;
  /** Entropy cost. For leveled nodes, base of `cost * costGrowth^level`. */
  cost: number;
  /** Repeatable scalar node: geometric cost growth. */
  costGrowth?: number;
  leveled?: boolean;
  /** Prerequisite node ids (DAG edges). */
  requires: string[];
  /** One or more effects this node grants. */
  effects: NodeEffectSpec[];
  isCapstone?: boolean;
  /** Layout position in the tree panel (grid units). */
  position: { x: number; y: number };
}

export interface DisciplineDef {
  id: DisciplineId;
  name: string;
  blurb: string;
  /** CSS color accent for this tree. */
  accent: string;
  nodes: readonly NodeDef[];
}

const matter: DisciplineDef = {
  id: "matter",
  name: "Matter",
  blurb: "Grow faster, build cheaper. The shape of a richer galaxy.",
  accent: "#e8c170", // warm gold
  nodes: [
    {
      id: "matter.deepening-hunger",
      name: "Deepening Hunger",
      description: "All Energy production ×1.5 per level.",
      cost: 1,
      costGrowth: 2.0,
      leveled: true,
      requires: [],
      effects: [{ effect: "energyMult", magnitude: 1.5 }],
      position: { x: 0, y: 0 },
    },
    {
      id: "matter.entropic-erosion",
      name: "Entropic Erosion",
      description: "Tier unlock costs ×0.9 per level.",
      cost: 3,
      costGrowth: 1.9,
      leveled: true,
      requires: [],
      effects: [{ effect: "cheaperTiers", magnitude: 0.9 }],
      position: { x: 2, y: 0 },
    },
    {
      id: "matter.dense-packing",
      name: "Dense Packing",
      description: "Generators cost ×0.92.",
      cost: 25,
      requires: ["matter.deepening-hunger"],
      effects: [{ effect: "generatorCostReduction", magnitude: 0.92 }],
      position: { x: 0, y: 1 },
    },
    {
      id: "matter.catalytic-spark",
      name: "Catalytic Spark",
      description: "Channeling Energy ×3.",
      cost: 40,
      requires: ["matter.deepening-hunger"],
      effects: [{ effect: "tapMult", magnitude: 3 }],
      position: { x: 1, y: 1 },
    },
    {
      id: "matter.stellar-forge",
      name: "Stellar Forge",
      description: "Stars and everything beyond produce ×2.",
      cost: 600,
      requires: ["matter.dense-packing"],
      effects: [{ effect: "tierEnergyMult", magnitude: 2, param: "stars+" }],
      position: { x: 0, y: 2 },
    },
    {
      id: "matter.mass-without-end",
      name: "Mass Without End",
      description: "All Energy production ×3.",
      cost: 5_000,
      requires: ["matter.catalytic-spark", "matter.stellar-forge"],
      effects: [{ effect: "globalMult", magnitude: 3 }],
      isCapstone: true,
      position: { x: 1, y: 3 },
    },
  ],
};

const hunger: DisciplineDef = {
  id: "hunger",
  name: "Hunger",
  blurb: "Gravitation and appetite. Every galaxy feeds the Attractor more.",
  accent: "#b06a8a", // the consume mauve
  nodes: [
    {
      id: "hunger.wider-maw",
      name: "Wider Maw",
      description: "Negentropy→Entropy conversion ×1.25 per level.",
      cost: 2,
      costGrowth: 2.0,
      leveled: true,
      requires: [],
      effects: [{ effect: "betterConversion", magnitude: 1.25 }],
      position: { x: 1, y: 0 },
    },
    {
      id: "hunger.event-horizon",
      name: "Event Horizon",
      description: "All Negentropy ×1.3 — galaxies read riper.",
      cost: 30,
      requires: ["hunger.wider-maw"],
      effects: [{ effect: "negentropyWeightMult", magnitude: 1.3 }],
      position: { x: 0, y: 1 },
    },
    {
      id: "hunger.patient-gravity",
      name: "Patient Gravity",
      description: "Consume never wastes ripeness below the softcap.",
      cost: 50,
      requires: ["hunger.wider-maw"],
      effects: [{ effect: "minRipenessFloor" }],
      position: { x: 2, y: 1 },
    },
    {
      id: "hunger.tidal-reach",
      name: "Tidal Reach",
      description: "Softens the meta falloff (meta softcap ×2).",
      cost: 400,
      requires: ["hunger.event-horizon"],
      effects: [{ effect: "metaSoftcapRaise", magnitude: 2 }],
      position: { x: 0, y: 2 },
    },
    {
      id: "hunger.the-long-devour",
      name: "The Long Devour",
      description: "Conversion ×2 and all Energy production ×1.5.",
      cost: 8_000,
      requires: ["hunger.patient-gravity", "hunger.tidal-reach"],
      effects: [
        { effect: "betterConversion", magnitude: 2 },
        { effect: "globalMult", magnitude: 1.5 },
      ],
      isCapstone: true,
      position: { x: 1, y: 3 },
    },
  ],
};

const time: DisciplineDef = {
  id: "time",
  name: "Time",
  blurb: "The Attractor is patient. Reward the hours you are away.",
  accent: "#7fc7e8", // pale cyan
  nodes: [
    {
      id: "time.slow-hours",
      name: "Slow Hours",
      description: "Offline cap +6 hours.",
      cost: 8,
      requires: [],
      effects: [{ effect: "offlineCapHours", magnitude: 6 }],
      position: { x: 1, y: 0 },
    },
    {
      id: "time.steady-drip",
      name: "Steady Drip",
      description: "Offline efficiency +25%.",
      cost: 60,
      requires: ["time.slow-hours"],
      effects: [{ effect: "offlineBoost", magnitude: 0.25 }],
      position: { x: 0, y: 1 },
    },
    {
      id: "time.clockwork-hands",
      name: "Clockwork Hands",
      description: "Auto-buy the cheapest affordable generator each tick.",
      cost: 120,
      requires: ["time.slow-hours"],
      effects: [{ effect: "autoBuyGenerators" }],
      position: { x: 2, y: 1 },
    },
    {
      id: "time.quickened-tick",
      name: "Quickened Tick",
      description: "Idle production ×1.5.",
      cost: 500,
      requires: ["time.steady-drip"],
      effects: [{ effect: "tickRateMult", magnitude: 1.5 }],
      position: { x: 0, y: 2 },
    },
    {
      id: "time.outside-time",
      name: "Outside Time",
      description: "Offline cap +54 hours and efficiency +50%.",
      cost: 10_000,
      requires: ["time.clockwork-hands", "time.quickened-tick"],
      effects: [
        { effect: "offlineCapHours", magnitude: 54 },
        { effect: "offlineBoost", magnitude: 0.5 },
      ],
      isCapstone: true,
      position: { x: 1, y: 3 },
    },
  ],
};

const mind: DisciplineDef = {
  id: "mind",
  name: "Mind",
  blurb: "Memory and instrumentation. See more of what you are doing.",
  accent: "#7fe7d8", // teal
  nodes: [
    {
      id: "mind.clear-optics",
      name: "Clear Optics",
      description: "Preview the next Scale comparison early.",
      cost: 5,
      requires: [],
      effects: [{ effect: "revealComparisons" }],
      position: { x: 0, y: 0 },
    },
    {
      id: "mind.bulk-channeling",
      name: "Bulk Channeling",
      description: "Unlock ×10 / Max generator buys.",
      cost: 15,
      requires: [],
      effects: [{ effect: "bulkBuyUnlock" }],
      position: { x: 2, y: 0 },
    },
    {
      id: "mind.telemetry-array",
      name: "Telemetry Array",
      description: "Unlock the Telemetry panel.",
      cost: 40,
      requires: ["mind.clear-optics"],
      effects: [{ effect: "panelUnlock", param: "telemetry" }],
      position: { x: 0, y: 1 },
    },
    {
      id: "mind.echoes",
      name: "Echoes",
      description: "Hints toward unrevealed facts in the log.",
      cost: 80,
      requires: ["mind.clear-optics"],
      effects: [{ effect: "factHint" }],
      position: { x: 1, y: 1 },
    },
    {
      id: "mind.deep-survey",
      name: "Deep Survey",
      description: "Unlock the Galaxy Survey panel.",
      cost: 150,
      requires: ["mind.telemetry-array"],
      effects: [{ effect: "panelUnlock", param: "survey" }],
      position: { x: 0, y: 2 },
    },
    {
      id: "mind.total-recall",
      name: "Total Recall",
      description: "Unlock every console panel.",
      cost: 6_000,
      requires: ["mind.deep-survey", "mind.echoes"],
      effects: [{ effect: "panelUnlock", param: "all" }],
      isCapstone: true,
      position: { x: 1, y: 3 },
    },
  ],
};

const voidline: DisciplineDef = {
  id: "void",
  name: "Void",
  blurb: "What waits past the last tier. It is aware of the survey.",
  accent: "#a684d8", // muted violet
  nodes: [
    {
      id: "void.hollow-resonance",
      name: "Hollow Resonance",
      description: "All Energy production ×2.",
      cost: 20_000,
      requires: [],
      effects: [{ effect: "globalMult", magnitude: 2 }],
      position: { x: 1, y: 0 },
    },
    {
      id: "void.unmaking",
      name: "Unmaking",
      description: "Makes the Instability toggle a real bonus.",
      cost: 50_000,
      requires: ["void.hollow-resonance"],
      effects: [{ effect: "instabilitySynergy" }],
      position: { x: 0, y: 1 },
    },
    {
      id: "void.the-pattern",
      name: "The Pattern",
      description: "+50% global production per other discipline mastered.",
      cost: 80_000,
      requires: ["void.hollow-resonance"],
      effects: [{ effect: "crossDisciplineMult", magnitude: 0.5 }],
      position: { x: 2, y: 1 },
    },
    {
      id: "void.what-remains",
      name: "What Remains",
      description: "All Energy production ×3. The last node.",
      cost: 10_000_000,
      requires: [
        "void.unmaking",
        "void.the-pattern",
        "matter.mass-without-end",
        "hunger.the-long-devour",
        "time.outside-time",
        "mind.total-recall",
      ],
      effects: [{ effect: "globalMult", magnitude: 3 }],
      isCapstone: true,
      position: { x: 1, y: 3 },
    },
  ],
};

export const disciplines: readonly DisciplineDef[] = [matter, hunger, time, mind, voidline];
