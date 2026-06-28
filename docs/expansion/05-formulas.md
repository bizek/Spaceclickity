# Phase 8 — Formulas & Balance (Expansion)

First-pass numbers, consistent with how the base game treats curves (starting points to be tuned in
the E6 balance pass). The hard constraint is **P1**: trees may *accelerate and smooth*, but must not
trivialize the meta falloff that keeps the long game calm.

---

## Node costs

- **Single-purchase scalar / unlock nodes:** flat `cost` in Entropy. Most nodes are single-purchase
  so a tree reads as a finite, completable thing (EVE skill-tree feel, not infinite grind).
- **Leveled scalar nodes** (a few per tree, as Entropy sinks): `cost(level) = base · growth^level`,
  with `growth` ∈ [1.7, 2.1] (same regime as today's prestige upgrades: 1.8–2.0).
- **Capstones:** expensive single-purchase; gated by prerequisites *and* (for Void) by owning other
  capstones.

### First-pass Entropy budget per tree

Entropy accrues slowly (sqrt prestige × meta falloff). Rough target: a tree's **root nodes** are
affordable within the first handful of Consumes, **mid nodes** over early-game, **capstone** is a
multi-session goal.

| Band | Indicative cost (Entropy) | Reached around |
|---|---|---|
| Root (migrated upgrades) | 1–3 (unchanged from today) | first cycles |
| Mid nodes | 10–500 | early game |
| Capstone | 5e3–5e5 | mid/late game |
| Void capstone (`What Remains`) | 1e7+ and all other capstones owned | endgame |

---

## Effect aggregation

Mirrors the existing `productOfEffect` exactly, generalized over discipline nodes:

```
multiplier(effect) = Π over owned nodes with that effect ( magnitude ^ level )
```

- `energyMult`, `tapMult`, `betterConversion`, `negentropyWeightMult`, `globalMult`,
  `tierEnergyMult` → **multiplicative** (≥1).
- `cheaperTiers`, `generatorCostReduction` → **multiplicative ≤1** (cost reductions).
- `offlineCapHours` → **additive** to the 12h base.
- `offlineBoost` → **additive** to efficiency (clamped, see below).
- Unlock effects → **boolean OR**.

`globalMult` folds into `prestigeEnergyMultiplier` so it rides the existing production path; it is
the single blunt lever, kept rare and expensive.

### Cross-discipline scaling

```
crossDisciplineMult total = 1 + perStep · (number of OTHER disciplines whose capstone is owned)
```

`perStep` ≈ 0.5 first-pass (owning all 4 others ⇒ ×3 on the node's discipline). This is the reward
for breadth and the reason Void is the last tree completed.

---

## Integration with the locked prestige curve (do not break it)

The base formula stays:

```
entropyGain   = K · conversionMult · sqrt(Negentropy / softcap)
effectiveGain = entropyGain · 1 / (1 + totalEntropy/metaSoftcap)^p
```

Trees touch it only through existing knobs, so the *shape* is unchanged:

- `betterConversion` nodes → multiply `conversionMult` (today's behavior).
- `negentropyWeightMult` nodes → multiply tier weights inside `deriveNegentropy` (raises Negentropy,
  flows through the same sqrt).
- `metaSoftcapRaise` nodes → multiply `metaSoftcap` (softens, never removes, the falloff).
- `minRipenessFloor` → guarantees Consume isn't wasteful at low ripeness; doesn't change peak gain.

**No node removes the meta falloff or the in-run sqrt DR.** That's the guardrail: power scales
*linearly-ish* in node count while the prestige curve stays sub-linear, so the long game keeps its
calm pacing instead of exploding.

---

## Balance guard (the thing to watch in E6)

The risk: stacked `energyMult`/`globalMult` nodes make Energy so large that tier unlocks are instant
and the run has no texture. Mitigations, in priority order:

1. **Keep raw multipliers behind capstones** (few, expensive). Most mid nodes are QoL,
   cost-reduction, or conversion — they smooth pacing without inflating it.
2. **Cost reductions floor out** (`generatorCostReduction`, `cheaperTiers` clamped so cost never < a
   small fraction of base) so they can't reach zero.
3. **`offlineBoost` efficiency clamps** (e.g. ≤ 100% unless a single explicit Time capstone pushes
   slightly past — and even then bounded).
4. **Re-verify the §9 BALANCING pacing targets** with a fully-noded save during E6; retune node
   magnitudes, not the core curve.

> Master rule check: none of these formulas introduce a timer, decay, or failure. They only make
> growth faster/smoother/riper. Attention is rewarded (`tapMult`, auto-buy frees you), never required.
