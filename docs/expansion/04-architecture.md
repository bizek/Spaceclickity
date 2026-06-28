# Phase 7 — Architecture Blueprint (Expansion)

Plain-English code structure for the expansion, before any code. The rule from the base game holds:
**generic systems interpret data**; new content is tables. The sim/render/ui separation is untouched.

---

## What's code vs. what's data

| Concern | Code (built once) | Data (added repeatedly) |
|---|---|---|
| Disciplines | `sim/disciplines.ts` aggregator, `ui/disciplinePanel.ts` renderer | `data/disciplines.ts` — every `NodeDef` |
| Console | `ui/console/Panel.ts` framework, panel renderers | `data/panels.ts` — every `PanelDef` (id, title, dock slot, unlock gate) |
| Effects | the interpreters in `sim/` | the `effect` term + `magnitude` on each node |

If adding a node or a panel requires touching anything in the "Code" column, the abstraction is wrong.

---

## New data structures

```ts
// data/disciplines.ts  (pure data)
type EffectParam = string;            // e.g. "stars+" for tierEnergyMult, "telemetry" for panelUnlock
interface NodeDef {
  id: string;                          // stable; lives in save data
  discipline: DisciplineId;
  name: string;
  description: string;
  cost: number;                        // Entropy (base; ×growth^level if leveled)
  costGrowth?: number;                 // leveled nodes only
  requires: string[];                  // prerequisite node ids (DAG)
  effect: NodeEffect;                  // the extended enum from 03-vocabulary
  magnitude?: number;                  // scalar nodes
  param?: EffectParam;                 // effects that need a target
  leveled?: boolean;                   // repeatable scalar
  isCapstone?: boolean;
  position: { x: number; y: number };  // layout in the tree panel (grid units)
}
interface DisciplineDef {
  id: DisciplineId;                    // "matter" | "hunger" | "time" | "mind" | "void"
  name: string;
  blurb: string;
  accent: string;                      // CSS color for this tree
  nodes: NodeDef[];
}

// data/panels.ts  (pure data)
interface PanelDef {
  id: string;                          // "telemetry" | "survey" | ...
  title: string;
  dock: "left" | "right" | "bottom-left" | "bottom-right" | "top";
  defaultOpen: boolean;
  unlockedBy?: string;                 // node id of a panelUnlock node; absent = always on
}
```

### GameState additions (save schema v4)

```ts
interface GameState {
  // ...existing...
  /** Discipline node id -> level owned (unlock nodes: 0|1; leveled: count). */
  disciplines: Record<string, number>;
  /** Console panel id -> collapsed?  (UI preference, persisted). */
  panelState?: Record<string, boolean>;
}
```

`prestigeUpgrades` is **retired into `disciplines`** by migration (see below). `panelState` is a UI
nicety; it may also live in its own localStorage key if we'd rather keep `GameState` purely about
the sim — decide at E1.

### Migration `migrations[3]`  (v3 → v4)

1. Create `disciplines = {}` (and `panelState`).
2. Map the three legacy prestige upgrades onto their new root-node ids, preserving levels:
   `hunger → matter.deepening-hunger`, `maw → hunger.wider-maw`, `erosion → matter.entropic-erosion`.
3. Delete `prestigeUpgrades` from the object (or leave it ignored — keep it for one version for
   safety, then drop).
4. Old saves with no Entropy spent migrate to an empty `disciplines` cleanly.

Verify, per project habit: a v3 save with each legacy upgrade at level ≥1 loads with the matching
node levels and identical effective multipliers.

---

## Module wiring (stays acyclic)

```
data/disciplines.ts ─┐
data/panels.ts       │ (pure data, no imports from sim/ui)
                     ▼
sim/disciplines.ts   →  reads state + data, exposes aggregators:
   nodeEffectProduct(state, effect, param?) -> Decimal
   hasUnlock(state, effect, param?) -> boolean
   buyNode(state, nodeId) -> boolean        // checks prereqs + cost, deducts Entropy
   isNodeAvailable(state, nodeId) -> boolean // prereqs met, affordable

sim/prestige.ts      →  its productOfEffect() generalizes to also fold in
                        nodeEffectProduct() (or delegates wholly to disciplines.ts).
sim/production.ts    →  energyMult/tapMult/tierEnergyMult include node products.
sim/derive.ts        →  negentropyWeightMult applies in deriveNegentropy.
sim/offline.ts       →  offlineCapHours/offlineBoost include node values.
sim/tick.ts          →  if hasUnlock(autoBuyGenerators): buy cheapest each tick.

ui/console/Panel.ts  →  generic panel chrome (title, collapse, dock).
ui/disciplinePanel.ts→  renders DisciplineDef as SVG edges + node buttons;
                        emits store.update(s => buyNode(s, id)).
ui/telemetryPanel.ts →  UI-side ring buffer of sampled stats; canvas sparklines.
ui/surveyPanel.ts    →  reads era/Scale/Negentropy; renders faux-scan text.
ui/console/frame.ts  →  scanlines/brackets/boot chrome (CSS/SVG).
```

**Acyclicity:** the new `sim/disciplines.ts` depends only on `data/` + `state/`; the existing sim
modules depend on it the same way they already depend on `prestige.ts`. No cycle. `ui/` depends on
`sim/` aggregators (read) and emits intents (write) — unchanged direction.

---

## Concrete walk-through: "player buys a Matter node"

1. `ui/disciplinePanel.ts` renders `matter.dense-packing` from `data/disciplines.ts`; shows its
   cost vs `state.entropy`; `isNodeAvailable` decides enabled/locked styling.
2. Click → `store.update(s => buyNode(s, "matter.dense-packing"))`. `buyNode` (in `sim/`) verifies
   prereqs + Entropy, deducts cost, sets `disciplines["matter.dense-packing"] = 1`.
3. The store notifies subscribers. `production.energyPerSecond` now multiplies in the new
   `generatorCostReduction`/`energyMult` product → the Readout's Energy/s and the Telemetry sparkline
   update with no extra wiring.
4. Autosave persists `disciplines`. No render/ui code knew the *meaning* of the node — only `sim/` did.

This is the same flow as buying a generator or prestige upgrade today, which is the point: the
expansion rides the validated path.

---

## Render/UI layout change (E1)

The current `#hud` is a fixed 3×3 `grid-template-areas`. The console replaces it with a denser dock
that **keeps the center column empty** for the WebGL canvas:

- Edges host stacked, collapsible panels (left: subsystems/Complexity + Disciplines launcher;
  right: Readout + Telemetry + Survey; corners: Cycle log, Consume; top: Entropy + entity + settings).
- A `frame.ts` chrome layer (scanlines, corner brackets, faint grid) sits **above** the canvas,
  **below** the panels, `pointer-events: none`.
- All of it respects `prefers-reduced-motion` and the quality setting (chrome animation + telemetry
  sample rate scale down on Low/reduced-motion).

No change to how `mountHud` *binds* state — only how it arranges and decorates.
