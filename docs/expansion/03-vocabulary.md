# Phase 5 — Mechanical Vocabulary (Expansion)

The grammar both new systems are written in. A discipline node is just a *sentence* in this grammar;
so is a console panel. If a "spaghetti" idea can be expressed with these terms, the vocabulary is
complete. New terms here **extend** the existing `PrestigeEffect` enum rather than replacing it.

---

## Node shapes

Every discipline node is one of two shapes:

- **Scalar node** — carries a `magnitude`; contributes a multiplier/additive to an effect. May be
  *single-purchase* (one level) or *leveled* (repeatable, geometric cost). Example sentence:
  *"Energy production ×1.5 per level."*
- **Unlock node** — boolean (`magnitude` ignored); flips a feature on. Example sentence:
  *"Unlock auto-buying the cheapest affordable generator each tick."*

A node definition is therefore:

```
NodeDef = {
  discipline,            // which tree
  id, name, description,
  cost,                  // Entropy
  requires: nodeId[],    // prerequisites (DAG edges)
  effect,                // a term from the Effect vocabulary below
  magnitude?,            // scalar nodes only
  leveled?: boolean,     // scalar nodes: repeatable + geometric cost
  position: {x, y},      // layout in the tree panel
}
```

---

## Effect vocabulary

The existing enum (`data/prestigeUpgrades.ts`) is:
`energyMult · cheaperTiers · fasterAutomation · betterConversion · offlineBoost`.

The expansion extends it. Effects are grouped by the system they feed. **Aggregation rule:** within
an effect type, scalar magnitudes combine **multiplicatively** (matching today's `productOfEffect`);
unlock effects are OR'd.

### Production (read by `production.ts` / `derive.ts`)
| Effect | Shape | Meaning |
|---|---|---|
| `energyMult` *(exists)* | scalar | × all Energy production. |
| `tapMult` | scalar | × Energy per manual tap (rewards active play; P1-safe). |
| `cheaperTiers` *(exists)* | scalar ≤1 | × tier unlock cost. |
| `generatorCostReduction` | scalar ≤1 | × generator purchase cost. |
| `tierEnergyMult` | scalar (+ param: which tiers) | × production from a subset of tiers (e.g. Stars+). |

### Conversion / prestige (read by `prestige.ts`)
| Effect | Shape | Meaning |
|---|---|---|
| `betterConversion` *(exists)* | scalar | × K (Negentropy→Entropy). |
| `negentropyWeightMult` | scalar | × all tier negentropy weights (riper universes). |
| `metaSoftcapRaise` | scalar | × `metaSoftcap` (softens the meta falloff). |
| `minRipenessFloor` | unlock | Consume never wastes ripeness below the in-run softcap. |

### Time / automation (read by `offline.ts` / `tick.ts`)
| Effect | Shape | Meaning |
|---|---|---|
| `offlineBoost` *(exists)* | scalar | + offline efficiency. |
| `offlineCapHours` | scalar (additive) | + the 12h offline cap. |
| `tickRateMult` | scalar | × production-application cadence (feel of "faster" automation). |
| `autoBuyGenerators` | unlock | Each tick, auto-buy the cheapest affordable generator. |

### Mind / QoL / console (read by `ui/`)
| Effect | Shape | Meaning |
|---|---|---|
| `revealComparisons` | unlock | Show the next Scale comparison early. |
| `factHint` | unlock | Hint toward unrevealed facts in the cycle log. |
| `bulkBuyUnlock` | unlock | Enable ×10 / Max buy on generators. |
| `panelUnlock` *(+ param: panelId)* | unlock | Unlock a console panel (Telemetry, Survey, …). |

### Void / capstone (read by `disciplines.ts` aggregator)
| Effect | Shape | Meaning |
|---|---|---|
| `globalMult` | scalar | × *everything* (folds into the energy multiplier; the blunt power node). |
| `instabilitySynergy` | unlock | Turns the opt-in `settings.instability` flag into a real bonus (gives the dormant hard-mode toggle a payoff). |
| `crossDisciplineMult` | scalar (per completed discipline) | × global per *other* discipline whose capstone is owned. |

---

## Stress test (the spaghetti check)

Weird ideas, expressed only in the grammar above — vocabulary holds:

- *"A capstone that doubles all production for every other discipline you've finished."* →
  `crossDisciplineMult`, magnitude 1× per completed discipline, leveled by completion count. ✅
- *"A node that lets you auto-buy generators while away."* → `autoBuyGenerators` (unlock). ✅
- *"A node that makes the dangerous instability toggle finally worth turning on."* →
  `instabilitySynergy` (unlock). ✅
- *"Reveal the next eerie comparison before you reach that Scale."* → `revealComparisons`. ✅
- *"A late node that just multiplies the whole game by 5."* → `globalMult`, magnitude 5. ✅
- *"Stars and galaxies produce double, but nothing below."* → `tierEnergyMult` with a tier-set
  parameter. ✅

Gap found and added during the stress test: `tierEnergyMult` needed a **parameter** (which tiers),
so the grammar allows an optional `param` field on effects that need one (`panelUnlock` also uses
it for the panel id). No other gaps surfaced.
