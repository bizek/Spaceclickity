# Disciplines — Node Catalog (first pass)

The data that fills System A. Five themed trees, each a small DAG ending in a capstone. Every node is
a sentence in the [vocabulary](03-vocabulary.md). Costs/magnitudes are **first-pass** starting points
(tune in E6 per [05-formulas.md](05-formulas.md)). Node ids are `<discipline>.<slug>` and are stable
save keys.

Legend: **[root]** = available from the start of the tree · **[cap]** = capstone ·
*leveled* = repeatable (geometric cost) · all others single-purchase.

---

## MATTER — production & economy  ·  accent: warm gold

The "grow faster, cheaper" tree. Absorbs two legacy prestige upgrades as roots.

| id | name | effect | mag | requires | cost | notes |
|---|---|---|---|---|---|---|
| `matter.deepening-hunger` **[root]** *leveled* | Deepening Hunger | `energyMult` | ×1.5 / lvl | — | 1 (×1.8) | *migrated from `hunger`* |
| `matter.entropic-erosion` **[root]** *leveled* | Entropic Erosion | `cheaperTiers` | ×0.9 / lvl | — | 3 (×1.9) | *migrated from `erosion`* |
| `matter.dense-packing` | Dense Packing | `generatorCostReduction` | ×0.92 | `deepening-hunger` | 25 | generators cheaper |
| `matter.catalytic-spark` | Catalytic Spark | `tapMult` | ×3 | `deepening-hunger` | 40 | rewards active tapping (P1-safe) |
| `matter.stellar-forge` | Stellar Forge | `tierEnergyMult` (param `stars+`) | ×2 | `dense-packing` | 600 | Stars/Galaxies/Life produce ×2 |
| `matter.mass-without-end` **[cap]** | Mass Without End | `globalMult` | ×3 | `catalytic-spark`, `stellar-forge` | 5e3 | the blunt power capstone |

## HUNGER (Gravitation) — conversion & prestige  ·  accent: the mauve `--consume`

Bigger, riper Consumes; softens the meta falloff. Absorbs one legacy root.

| id | name | effect | mag | requires | cost | notes |
|---|---|---|---|---|---|---|
| `hunger.wider-maw` **[root]** *leveled* | Wider Maw | `betterConversion` | ×1.25 / lvl | — | 2 (×2.0) | *migrated from `maw`* |
| `hunger.event-horizon` | Event Horizon | `negentropyWeightMult` | ×1.3 | `wider-maw` | 30 | universes read riper |
| `hunger.patient-gravity` | Patient Gravity | `minRipenessFloor` (unlock) | — | `wider-maw` | 50 | Consume never wastes ripeness |
| `hunger.tidal-reach` | Tidal Reach | `metaSoftcapRaise` | ×2 | `event-horizon` | 400 | softens meta falloff |
| `hunger.the-long-devour` **[cap]** | The Long Devour | `betterConversion` ×2 **+** `globalMult` ×1.5 | — | `patient-gravity`, `tidal-reach` | 8e3 | two-effect capstone |

## TIME — offline & automation  ·  accent: pale cyan

The AFK-pillar tree. Pure "play less, get more" — the most on-brand discipline.

| id | name | effect | mag | requires | cost | notes |
|---|---|---|---|---|---|---|
| `time.slow-hours` **[root]** | Slow Hours | `offlineCapHours` | +6h | — | 8 | 12h → 18h cap |
| `time.steady-drip` | Steady Drip | `offlineBoost` | +25% eff | `slow-hours` | 60 | better AFK efficiency |
| `time.clockwork-hands` | Clockwork Hands | `autoBuyGenerators` (unlock) | — | `slow-hours` | 120 | auto-buys cheapest generator each tick |
| `time.quickened-tick` | Quickened Tick | `tickRateMult` | ×1.5 | `steady-drip` | 500 | snappier automation feel |
| `time.outside-time` **[cap]** | Outside Time | `offlineCapHours` +54h **+** `offlineBoost` to 100% | — | `clockwork-hands`, `quickened-tick` | 1e4 | 72h cap, full efficiency |

## MIND (Memory) — QoL, reveal & console unlocks  ·  accent: teal `--accent`

Unlocks console panels and quality-of-life. The bridge to System B.

| id | name | effect | mag | requires | cost | notes |
|---|---|---|---|---|---|---|
| `mind.clear-optics` **[root]** | Clear Optics | `revealComparisons` (unlock) | — | — | 5 | preview the next Scale comparison |
| `mind.bulk-channeling` | Bulk Channeling | `bulkBuyUnlock` (unlock) | — | — | 15 | ×10 / Max generator buys |
| `mind.telemetry-array` | Telemetry Array | `panelUnlock` (param `telemetry`) | — | `clear-optics` | 40 | unlocks the Telemetry panel |
| `mind.deep-survey` | Deep Survey | `panelUnlock` (param `survey`) | — | `telemetry-array` | 150 | unlocks the Universe Survey panel |
| `mind.echoes` | Echoes | `factHint` (unlock) | — | `clear-optics` | 80 | hints toward unrevealed facts |
| `mind.total-recall` **[cap]** | Total Recall | `panelUnlock` (param `all`) **+** `crossDisciplineMult` feed | — | `deep-survey`, `echoes` | 6e3 | every panel; counts toward Void's web |

## VOID (Entropy) — horror payoff  ·  accent: near-black violet

Expensive, late, and where breadth pays off. The dread tree.

| id | name | effect | mag | requires | cost | notes |
|---|---|---|---|---|---|---|
| `void.hollow-resonance` **[root]** | Hollow Resonance | `globalMult` | ×2 | — | 2e4 | gated by sheer Entropy cost |
| `void.unmaking` | Unmaking | `instabilitySynergy` (unlock) | — | `hollow-resonance` | 5e4 | makes the `instability` toggle a real bonus |
| `void.the-pattern` | The Pattern | `crossDisciplineMult` | +0.5 / other capstone | `hollow-resonance` | 8e4 | scales with finished trees |
| `void.what-remains` **[cap]** | What Remains | `globalMult` | ×5 | `unmaking`, `the-pattern`, **+ all four other capstones** | 1e7 | true endgame node |

---

## Tree-shape notes

- Each tree is a shallow DAG (depth 3–4), so a tree panel fits without scrolling and reads at a
  glance — EVE skill-plan clarity, not a Path-of-Exile sprawl.
- **Roots are reachable immediately** within a tree; the two leveled roots (Matter/Hunger) are the
  migrated legacy upgrades, so existing saves keep their power seamlessly.
- **Void is intentionally walled off** by cost and by the cross-capstone requirement — it's the
  "complete the game" objective and the strongest expression of the horror payoff.
- Counts here total **27 nodes**. Adding more later is pure data — no code change (P5).

## Open tuning questions (E6)

- Are the two `globalMult` capstones (Matter, Hunger) plus Void's stack too much multiplicative
  power together? Likely cap the *number* of `globalMult` sources or lower each magnitude.
- Should `time.clockwork-hands` auto-buy be gated to "only when affordable without dropping below X
  Energy" to avoid starving manual tier unlocks? Decide when wiring `tick.ts`.
- Does `revealComparisons` spoil the dread pacing? Consider making it reveal *redacted/garbled* text
  rather than the full line.
