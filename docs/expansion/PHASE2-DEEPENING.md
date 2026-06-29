# Expansion — Phase 2: Deepening

Phase 1 (E1–E5) built the command console + discipline trees. Phase 2 deepens the *core* of the
game from a set of designer notes: a tactile channel interaction, living per-era visuals, a longer
Complexity ladder, and a rich generator-upgrade matrix. (E6 polish — boot sequence, sound, balance,
perf — folds in at the end of this phase.)

---

## Locked direction (designer's calls)

| Fork | Decision |
|---|---|
| **Generator upgrade variables** | **Rate · Efficiency · Mass · Density** — four pip tracks per source. |
| **Upgrade economy** | **Per-run (Energy)** — reset each Consume; you re-develop every universe. |
| **Ladder scope** | **Fill the gap *and* extend the high-end** — add Molecules, Nebulae, Clusters, Civilization. |
| **Build first** | **Hold-to-channel + the atom visual.** |

Build order: **P1 Channeling & Living Visuals** → **P2 Ladder expansion** → **P3 Generator pip
matrix** → fold in E6 polish (boot/sound/balance/perf).

---

## P1 — Channeling & Living Visuals  *(building now)*

### Hold-to-channel (replaces tap)
- The center is a **hold-to-channel** zone: `pointerdown` starts channeling, `pointerup`/leave/cancel
  stops. No more discrete taps.
- While held, Energy flows continuously at `channelRate(state)`, with **intensity ramping 0→1** over
  a short spin-up so a sustained hold feels like it's "spooling up." Capped — never required (AFK
  pillar: idle generators run regardless).
- `channelRate = baseChannelPerSecond · tierMultiplier · prestigeEnergyMultiplier · channelMult`.
  The Matter node **Catalytic Spark** keeps its `tapMult` effect key but now reads as a **channel**
  multiplier (copy updated; no data migration).
- **Decoupling:** UI owns the gesture + ramp and emits `channel(state, dt, intensity)` intents; a
  tiny transient singleton (`render/channeling.ts` — NOT in `GameState`) carries `{active, intensity}`
  so the render layer can draw the inflow without the sim knowing about visuals.

### Channel visual
- While channeling, a stream of particles is **dragged inward** toward the gravity well and the core
  brightens/grows with intensity — early game (just the glowing ball) this visibly accretes matter.

### Living visuals — bespoke per-era forms
- Move from one parametric cloud toward **structured forms** that fade in per era, starting with the
  one the designer called out: at the **Atoms** era, render a **nucleus + electrons on orbital rings**
  (so "your universe spans a single atom" *looks* like an atom). The base cloud dims while a form is
  active so it reads as the form, not cloud-plus-form.
- Framework: each `TierVisualKey` may register a "form" sub-object with `fadeIn/out`. **P1 ships the
  atom form**; later tiers (molecules = linked clusters, nebula = volumetric gas, stars = igniting
  points, galaxy = spiral, …) are added one at a time in P2/P3 as their tiers land.

---

## P2 — Ladder expansion

Insert the missing cosmology and extend both ends. New `tiers.ts` order:

```
Quantum foam → Particles → Atoms → [Molecules] → [Nebulae] → Stars → Galaxies
  → [Clusters] → Life → [Civilization] → ???
```

| New tier | Slot | Fiction | Visual form |
|---|---|---|---|
| **Molecules** | Atoms→ | first chemistry; compounds self-assemble | linked atom clusters |
| **Nebulae** | →Stars | gas & dust; the cradle of stars | volumetric glowing cloud |
| **Clusters** (Cosmic Web) | Galaxies→ | galaxies string along the web | filamentary lattice of points |
| **Civilization** | Life→ | minds spread; the glow organizes | structured grid / lights |

Each new tier needs: a `TierDef` (cost/energyMult/negentropyWeight/scaleContribution/visualKey/factId),
its generator source(s) (built on the P3 system), a fact (`facts.ts`), survey copy (`survey.ts`), and
a render form. **Negentropy weights re-tuned** so the spike still lands at Life/???. Comparisons in
`comparisons.ts` get intermediate entries so Scale flavor stays dense.

**Migration:** inserting mid-ladder means old saves can have a later tier unlocked while a new earlier
one isn't. The v4→v5 migration unlocks each inserted tier whose *following* tier is already unlocked
(so a save at Stars auto-owns Molecules+Nebulae). Forward-compatible, no progress lost.

---

## P3 — Generator pip matrix

Replace the single "buy more units" axis with **sources + per-variable pip tracks**.

- **Sources:** ~2 generators per tier (variety), each `GeneratorDef` as today plus upgrade tracks.
- **Variables (per source), all bought with per-run Energy:**
  - **Rate** — × production output.
  - **Efficiency** — lowers cost / cost-growth (own more units per Energy).
  - **Mass** — × this source's contribution to **Scale** (upgrades physically swell the universe).
  - **Density** — × this source's contribution to **Negentropy** (riper Consume).
- **Pip leveling (the designer's notation):** each variable shows **5 pips**. Levels 1–5 fill the
  pips in band-1 color; level 6 resets the pips and advances to band-2 color; band-3 after. **5 pips ×
  3 colors = 15 levels** per variable, extensible by adding colors. Each pip is a purchase that bumps
  the variable; a **larger "milestone" jump at every color change**. Costs escalate per level.
- **State:** `generatorUpgrades: Record<sourceId, Record<variable, level>>` (per-run; cleared on
  Consume like `generators`). Save **v5/v6**.
- **Derivation:** `derive.ts`/`production.ts` read the per-source Rate/Mass/Density/Efficiency instead
  of the flat per-tier numbers. Mass feeds Scale, Density feeds Negentropy — so upgrading is what
  grows the visible universe and the Consume payoff.
- **UI:** the GENERATORS panel lists each source with its four pip tracks beneath it (a compact pip
  row + buy button per variable).

---

## Pillar check

All of this stays inside the locked pillars: channeling **rewards** active play but idle still runs
(P1 AFK pillar); the new forms/tiers are flavor + spectacle (P2 horror-in-visuals); nothing adds a
timer, decay, or failure. The generator matrix is per-run depth, not permanent grind.
