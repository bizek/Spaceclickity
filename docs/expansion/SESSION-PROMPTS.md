# Phase 2 — Session Prompts (run each in a fresh Claude Code session)

The remaining expansion work, decomposed into self-contained prompts so each runs in a clean
session without the originating chat's context. Each prompt names the exact docs/files to read first.

## How to use

1. Open a **fresh Claude Code session** in `E:\Projects\Space ClickerZ`.
2. Pick the model tier for the task (below), then paste that task's prompt verbatim.
3. Respect dependencies (run earlier phases first). Tasks in the same phase touch different
   subsystems and can run in parallel.

| Tier | Model | Use for |
|---|---|---|
| **1 — Light** | Haiku | small, mechanical, pattern-following |
| **2 — Standard** | Sonnet | implementation from a clear spec |
| **3 — Heavy** | Opus | architecture, cross-cutting sim/save changes, balance judgment |

**Standing rules baked into every prompt:** game logic only in `sim/`; `render/` & `ui/` read state
and emit intents; all tunables in `src/data/`; strict TS, no `any`; `npm run typecheck` must pass;
browser-verify; append a milestone entry to `NOTES.md`. **Do NOT commit or `git add` — commits are
paused and there are stacked uncommitted changes; leave them.**

> Browser-verify caveat (applies to render/UI tasks): the Preview MCP `preview_screenshot` returns
> stale frames while the page hot-reloads. Restart the preview server for a clean page, and trust
> live render-state inspection over a single screenshot.

---

## CURRENT STATUS (keep this updated as tasks land)

**Done:** P2a, P2b, P3a, Galaxy Rescope **G1**, Galaxy Rescope **G2**.
**Remaining:** **P3b** → then **E6a / E6b / E6d** (independent of each other) → **E6c** (last).
**Current save version:** `SAVE_VERSION = 7` in `src/state/schema.ts` (migrations 1→7 exist).
- `migrations[4]` v4→v5 = ladder expansion (P2a); `migrations[5]` v5→v6 = galaxy (G2);
  `migrations[6]` v6→v7 = generator pip-upgrades (P3a).

**Known pre-existing typecheck noise (NOT your bug):** `npm run typecheck` reports two errors in
`vite.config.ts` (`Cannot find name 'process'`). These predate this work and are unrelated — "typecheck
must pass" means **all `src/` files are clean**; ignore the two `vite.config.ts` lines.

> **Schema rule for any task that changes the save:** do NOT trust a version number written into a
> prompt below — open `src/state/schema.ts`, read the live `SAVE_VERSION`, bump to the **next** integer,
> and add `migrations[<that-1>]`. Prompts were authored before later tasks bumped the version.

---

## Execution Plan

### Phase 1 — Ladder data (do first)
- ✅ **P2a** [Tier 3] — insert 4 tiers + parametric era visuals + v4→v5 migration + negentropy retune — **DONE**

### Phase 2 — Features on the new ladder (parallel; depend on P2a)
- ✅ **P2b** [Tier 2] — bespoke render forms for the 4 new eras (follows the atom-form pattern) — **DONE**
- ✅ **P3a** [Tier 3] — generator pip-upgrade system: sources + Rate/Efficiency/Mass/Density tracks (data + sim + save bump) — **DONE**

### Galaxy Rescope (retrofit; see bottom of file)
- ✅ **G1** [Tier 2] — universe→galaxy reframe + ladder reconciliation — **DONE**
- ✅ **G2** [Tier 3] — galaxy variety: morphologies + real names + run modifiers (v5→v6 migration) — **DONE**

### Phase 3 — Generator UI (depends on P3a) — NEXT
- **P3b** [Tier 2] — GENERATORS panel: per-source pip rows (5-pip × color band)

### Phase 4 — Polish (E6a/E6b/E6d independent; E6c last, depends on all features)
- **E6a** [Tier 2] — console boot sequence
- **E6b** [Tier 1] — console sound cues
- **E6d** [Tier 2] — perf re-verify across quality tiers + reduced-motion
- **E6c** [Tier 3] — first real balance pass (depends on P2a/P2b/P3a/P3b + G2 modifiers)

### Token estimate (instruction overhead; actual session cost is dominated by file reads/edits)
- Tier 1 (E6b): ~1 × (~350 in / ~1k out)
- Tier 2 (P2b, P3b, E6a, E6d): ~4 × (~600 in / ~3k out)
- Tier 3 (P2a, P3a, E6c): ~3 × (~1.4k in / ~5k out)
- Rough total prompt overhead: ~7k in. (Each session itself will read/edit many files beyond this.)

---

## Task P2a — Ladder expansion: 4 new tiers + migration
**✅ DONE — do not re-run (kept for history).**
**Tier**: 3 → Opus · **Depends on**: none

```
You are in the Space ClickerZ repo (E:\Projects\Space ClickerZ): a Vite + TypeScript (strict) idle
game with decoupled sim/render/ui and data-driven content in src/data/. Save schema is at v4.

## Goal
Lengthen the Complexity ladder so it doesn't jump from Atoms straight to Stars and so the high end
has more steps. Correctness matters: this touches a save migration and the core progression order.

## Read first
docs/expansion/PHASE2-DEEPENING.md (§P2), src/data/tiers.ts, src/data/generators.ts,
src/data/facts.ts, src/data/survey.ts, src/data/comparisons.ts, src/render/universe.ts (the ERAS map
+ currentEraKey), src/sim/derive.ts, src/state/schema.ts, src/state/migrations.ts, src/sim/actions.ts
(nextUnlockableTier). Skim NOTES.md "Milestone E3"/"P1" for conventions.

## Task
Insert four tiers and keep everything in sync:
- Molecules and Nebulae BETWEEN Atoms and Stars; Clusters AFTER Galaxies; Civilization AFTER Life.
1. tiers.ts — add the 4 TierDefs at the right ladder positions; extend the TierVisualKey union with
   "molecules" | "nebulae" | "clusters" | "civilization". Re-tune negentropyWeight across the WHOLE
   ladder so it stays strictly increasing and super-linear, with the deliberate spikes still at Life
   and ??? (the new tiers fill in smoothly; don't flatten the Life/??? payoff). First-pass
   unlockCost/energyMult/scaleContribution that interpolate sensibly between neighbours.
2. generators.ts — one generator source per new tier (requiresTier set correctly).
3. facts.ts — one tier-reached fact per new tier; cold, vast, eerie tone (match existing copy).
4. survey.ts — surveyByEra entries for the 4 new visualKeys (structure + classification; add a
   lifesign line where it fits, e.g. Civilization).
5. comparisons.ts — add intermediate Scale comparison entries so the flavor stays dense across the
   longer ladder.
6. render/universe.ts — add parametric ERAS entries for the 4 new visualKeys (color/radius/pointSize/
   spin/coreScale) so they render as distinct colored clouds for now. (Bespoke FORMS are a separate
   task — do not build them here.)
7. schema.ts + migrations.ts — bump SAVE_VERSION to 5; add migrations[4] (v4→v5) that auto-unlocks
   each INSERTED tier when its FOLLOWING tier is already unlocked, so existing saves don't regress
   (a save at Stars must come out with Molecules+Nebulae also unlocked; a save at ??? owns everything
   inserted before it).

## Approach
1. Decide the final ordered tier list and the negentropyWeight curve before editing.
2. Reason through the migration: process so chained insertions resolve correctly regardless of order;
   confirm the result keeps the ladder a valid sequential chain for nextUnlockableTier (no "next" tier
   ever sits before an already-owned one).
3. Then implement, typecheck, and browser-verify.

## Constraints
- No inlined balance numbers in logic — all in src/data/. TierVisualKey union and the ERAS map must
  stay exhaustive (the Record<TierVisualKey, ...> will fail to compile otherwise — good).
- Don't build bespoke render forms or touch the generator-upgrade system here.

## Success criteria
- npm run typecheck passes.
- Seeding a v4 save with Stars unlocked (paste a save into localStorage, neutralize setItem, reload)
  loads at v5 with Molecules+Nebulae auto-unlocked AND Stars still unlocked; nextUnlockableTier points
  forward, never backward.
- The COMPLEXITY ladder shows the 4 new tiers; deriveNegentropy is monotonic along the ladder.

Output: the code changes, then append a "Milestone P2a" section to NOTES.md (what changed, the
migration rule, deviations). Do NOT commit or git add.
```

---

## Task P2b — Bespoke render forms for the new eras
**✅ DONE — do not re-run (kept for history).**
**Tier**: 2 → Sonnet · **Depends on**: P2a

```
You are in the Space ClickerZ repo (E:\Projects\Space ClickerZ): Vite + TS (strict), Three.js render
that reads state only. The Complexity ladder now includes Molecules, Nebulae, Clusters, Civilization
(visualKeys "molecules"/"nebulae"/"clusters"/"civilization").

## Read first
src/render/universe.ts (study the existing ATOM form: nucleus sprite + dotted orbital rings built
from glow point-sprites + electron sprites; it fades in at the "atoms" visualKey and contracts+dims
the base cloud), docs/expansion/PHASE2-DEEPENING.md (§P1 living visuals, §P2 form column),
src/render/textures.ts, src/render/scene.ts.

<context>
CRITICAL gotcha (a real bug that already happened here): sub-objects you create MUST be added to the
scene graph. The atom's orbital groups were built but never parented to the atom group, so they were
invisible (world matrix stuck at origin) even though their .visible flags were true. After building
each form, verify a sample sub-object's WORLD position is non-identity — don't trust .visible/.opacity.
</context>

<task>
Add a bespoke "form" per new era in render/universe.ts, mirroring the atom-form structure (a sub-group
that fades in at its visualKey via an eased opacity, and recedes the diffuse base cloud like the atom):
1. Molecules — a few linked atom-like nodes (small glow clusters) joined by dotted "bond" lines made
   of glow point-sprites (not 1px LineLoops — WebGL ignores line width).
2. Nebulae — layered wispy volumetric haze (overlapping haze sprites), slow drift.
3. Clusters / Cosmic Web — a filamentary lattice: points strung along a few branching strands.
4. Civilization — a structured lattice/grid of small lights (ordered, vs. the organic forms).
Each fades in only at its era and out otherwise; reuse the atom's cloud contract+dim approach.
</task>

<constraints>
- render reads state only; no game logic.
- ADD every created object to its parent group; after construction, assert a sample child's world
  position is sane.
- Honor settings.reducedMotion (no/slow motion) and settings.quality (scale point counts; keep it
  cheap — these run with bloom).
- Follow the existing era-morph + atomOpacity easing pattern; don't rewrite the cloud/core system.
</constraints>

Output: universe.ts changes, then a "Milestone P2b" NOTES.md entry. Browser-verify each era (seed a
save whose top tier is each new visualKey). Note: preview_screenshot can be stale during hot-reload —
restart the preview server for a clean page and/or inspect render state. Do NOT commit.
```

---

## Task P3a — Generator pip-upgrade system (data + sim + save)
**✅ DONE — do not re-run (kept for history).** Shipped: `src/data/generatorUpgrades.ts` (tracks +
`pipBand` curve), `src/sim/generatorUpgrades.ts` (getters + multipliers), `buyGeneratorUpgrade` in
`src/sim/actions.ts`, `generatorUpgrades` on the schema (v6→v7), 2 sources per tier in
`src/data/generators.ts`. NOTE: it bumped the save to **v7** (not the v6 written below — G2 took v6).
**Tier**: 3 → Opus · **Depends on**: P2a

```
You are in the Space ClickerZ repo (E:\Projects\Space ClickerZ): Vite + TS (strict), decoupled
sim/render/ui, break_infinity.js for currencies, data in src/data/. This task builds the data + sim
for the generator pip-upgrade matrix; the UI is a separate task (P3b).

## Goal
Turn each generator from a single "buy more units" axis into a source with four per-run upgrade
tracks. Correctness matters: it changes derivation (Scale/Negentropy/production/cost) and the save.

## Read first
docs/expansion/PHASE2-DEEPENING.md (§P3 — the authoritative spec), docs/expansion/05-formulas.md,
docs/expansion/04-architecture.md, src/data/generators.ts, src/data/tiers.ts, src/sim/production.ts,
src/sim/derive.ts, src/sim/actions.ts (costForN/effectiveGenCost/buyGenerator), src/sim/prestige.ts
(consume — what resets per run), src/state/schema.ts, src/state/migrations.ts.

## Task
1. data/generators.ts — make ~2 sources per tier (variety). Keep GeneratorDef's existing fields.
2. Define the four UPGRADE TRACKS per source, bought with per-run Energy: Rate (×production),
   Efficiency (lowers cost / cost-growth), Mass (×this source's Scale contribution), Density
   (×this source's Negentropy contribution). Model the "pip band" cost+effect curve as data: 5 pips
   per color band, larger effect jump at each band boundary; level = pip count (5 pips × 3 bands = 15
   to start, extensible). Put the curve constants in src/data/ (a balance table), not in logic.
3. state/schema.ts — add `generatorUpgrades: Record<sourceId, Record<trackId, number>>` (per-run;
   cleared on Consume alongside `generators`). Bump SAVE_VERSION; add the migration (default empty).
   NOTE: if P2a already moved the schema to v5, bump to v6 and add migrations[5].
4. sim — wire the tracks: Rate→production.ts (energyPerSecond), Efficiency→actions.ts
   (effectiveGenCost/maxAffordableFor), Mass→derive.ts (deriveScale, per-source), Density→derive.ts
   (deriveNegentropy, per-source). Add a buy intent `buyGeneratorUpgrade(state, sourceId, trackId)`
   with the pip-band cost. Ensure prestige.consume() clears generatorUpgrades.
5. Keep modules acyclic (mirror how sim/disciplines.ts is consumed).

## Approach
1. Lock the data shapes (SourceDef tracks, pip-band cost/effect table) before editing sim.
2. Decide how Mass/Density attach per-source to deriveScale/deriveNegentropy without breaking the
   existing tier-based formulas (read derive.ts first; keep it continuous with current values when no
   upgrades are owned).
3. Implement, typecheck, browser-verify a buy moving Energy/Scale/Negentropy, confirm Consume resets.

## Constraints
- Upgrades are PER-RUN (Energy), reset on Consume. No new permanent currency.
- All curves/constants in src/data/. Strict TS, no any.
- Don't build the UI here (that's P3b) — but expose the buy intent + a per-source/per-track level
  getter the UI can read.

## Success criteria
- npm run typecheck passes.
- Buying a Rate pip raises Energy/s; a Mass pip raises Scale; a Density pip raises Negentropy; an
  Efficiency pip lowers the next generator cost — each verified live.
- With zero upgrades owned, Scale/Negentropy/production/cost equal their pre-change values (continuity).
- Consume clears generatorUpgrades.

Output: code changes + a "Milestone P3a" NOTES.md entry (data shapes, save version, wiring, the
pip-band curve, deviations). Do NOT commit.
```

---

## Task P3b — GENERATORS panel: pip-upgrade UI
**Tier**: 2 → Sonnet · **Depends on**: P3a

```
You are in the Space ClickerZ repo (E:\Projects\Space ClickerZ): Vite + TS (strict), vanilla-DOM HUD
that subscribes to a store and emits intents. P3a (DONE) added a generator pip-upgrade system: each
source has four tracks (Rate/Efficiency/Mass/Density), bought with per-run Energy, leveled as 5 pips ×
3 colour bands (15 levels max). There are now ~2 sources per tier (22 total). This task is UI only.

## Read first
- `src/ui/generatorPanel.ts` — the current panel: it already iterates ALL `generators` into `.gen-row`s,
  hides locked tiers, and emits buy intents. You are rebuilding this to add the per-track pip rows.
- `src/data/generatorUpgrades.ts` — the track defs + pip-band visual constants. Use these, do not invent:
  `upgradeTracks` (id/name/description/`symbol`/`mode` for the 4 tracks), `pipBand.pipsPerBand` (5),
  `pipBand.maxBands` (3), `pipBand.bandColors` (`["#4fd6c8","#e8c170","#c79bd6"]` = teal→gold→mauve),
  `MAX_PIP_LEVEL` (15).
- `src/sim/generatorUpgrades.ts` — the read API + buy-cost (ALL pure, UI-safe):
  `generatorUpgradeLevel(state, sourceId, trackId)` → pip count;
  `generatorUpgradeCost(state, sourceId, trackId)` → next pip Energy cost as Decimal, or `null` if maxed;
  `isTrackMaxed(level)`; `pipBandState(level)` → `{ band, filledPips, pipsPerBand, maxBands, color, atMax }`
  (use this to render each pip row — `filledPips` of `pipsPerBand` filled, in `color`).
- `src/sim/actions.ts` — the buy intent `buyGeneratorUpgrade(state, sourceId, trackId)` (emit via
  `store.update`); plus the existing `buyGenerator` / `effectiveGenCost` / `maxAffordableFor` for units.
- `src/ui/console/panel.ts`, `src/style.css` (existing `.gen-*` styles + console CSS tokens),
  docs/expansion/PHASE2-DEEPENING.md (§P3 — the pip visual intent).
- `UpgradeTrackId` type is exported from `src/data/generatorUpgrades.ts` ("rate"|"efficiency"|"mass"|"density").

<task>
Rebuild the GENERATORS panel so each source lists its four upgrade tracks beneath it. For each track
render a compact PIP ROW — `pipsPerBand` pips, `filledPips` of them filled in the band's `color` (from
`pipBandState`), advancing teal→gold→mauve as bands complete — and a buy button showing the next pip's
Energy cost (disabled when unaffordable or when `pipBandState(level).atMax`). Keep the existing per-source
"buy units" control, plus the gated ×10 (`bulkBuyUnlock` via `hasUnlock`) already present. Iterate
`upgradeTracks` for the four rows (use each track's `symbol`/`name`); do not hardcode track ids/colors.
</task>

<constraints>
- UI reads state & emits intents only; no game logic, no balance numbers (read them from data/sim).
- Reactive via store.subscribe (match the current panel's update pattern; build rows once, update text/
  disabled/pip-fill in the subscriber).
- Keep it legible at the dock width; respect the console aesthetic (CSS vars, monospace, tabular nums).
- Accessibility: real <button>s with aria-labels (e.g. "Buy Rate pip for Vacuum fluctuation").
</constraints>

Output: generatorPanel.ts (+ any small helper) and style.css additions, then a "Milestone P3b"
NOTES.md entry. Browser-verify: pips fill and advance color across a band boundary; buying a pip
updates Energy + the row live. preview_screenshot may be stale mid hot-reload — restart the preview
server if needed (note: another dev server may hold port 5173; the Preview MCP auto-picks a free port).
Do NOT commit.
```

---

## Task E6a — Console boot sequence
**Tier**: 2 → Sonnet · **Depends on**: none (console exists)

```
You are in the Space ClickerZ repo (E:\Projects\Space ClickerZ): Vite + TS (strict). The HUD is an
EVE/X4-style "command console" of panels with a chrome layer.

## Read first
docs/expansion/COMMAND_CONSOLE.md (§Chrome layer — the boot sequence spec), src/ui/console/frame.ts,
src/ui/console/panel.ts (`createPanel({ id, title })` — every panel root carries that `id`),
src/ui/hud.ts, src/style.css (console tokens + .panel/.cf-* styles), src/services/audio.ts. Note how
the Consume FX uses a persisted "seen" flag (`seenConsumeFX` on the schema) + `settings.skipConsumeFX`
to play once. The panels currently mounted in hud.ts (stagger these): COMPLEXITY, TELEMETRY,
GALAXY SURVEY (left dock) and READOUT, GENERATORS, DISCIPLINES (right dock) — TELEMETRY & GALAXY SURVEY
may be hidden behind Mind `panelUnlock` gating, so stagger only the panels actually visible on load.

<task>
On load, play a brief staggered "power-on": panels fade/slide in in sequence with a one-line type-on
status in the chrome, then settle. Skip it after first view (persist a `seenBoot` flag in its own
localStorage key, mirroring how `seenConsumeFX` gates the Consume FX) and under
`settings.reducedMotion`, `prefers-reduced-motion`, or `settings.quality === "low"`.
</task>

<constraints>
- Pure render/ui; no game logic. CSS/JS animation only; honor prefers-reduced-motion + the
  reducedMotion setting + quality (skip/shorten on low).
- Persist seenBoot in its own localStorage key (don't bump the save schema for a cosmetic flag).
- Don't cover the center canvas; don't regress the 60-FPS cap.
</constraints>

Output: frame.ts/hud.ts/style.css changes (+ a tiny boot module if cleaner), then a "Milestone E6a"
NOTES.md entry. Browser-verify the boot plays once then is skipped on reload. Do NOT commit.
```

---

## Task E6b — Console sound cues
**Tier**: 1 → Haiku · **Depends on**: none

```
Add subtle WebAudio cues to the Space ClickerZ console (E:\Projects\Space ClickerZ), off by default
like the existing audio.

Read src/services/audio.ts (the `audio.cue(kind)` synth + `setEnabled`; the `Cue` type is currently
`"tap" | "unlock" | "milestone" | "consume"` and each kind maps to a `blip(freq, dur, gain, type)` in
the switch), src/ui/console/panel.ts (panel collapse/expand toggle), src/ui/disciplinePanel.ts (node
buy). NOTE: src/ui/channel.ts ALREADY calls `audio.cue("tap")` on channel start — leave it, do not
double-add.

Extend the `Cue` union with 1–2 new kinds (e.g. "panel", "node"), add their `case`s in `cue()` (quiet,
brief blips — follow the existing freq/dur/gain scale), and call `audio.cue(...)` at: panel
collapse/expand toggle and discipline node purchase. Cues are gated by the existing `settings.sound`
(default off) via `audio.setEnabled` in main.ts — no new setting needed.

Output: audio.ts + the call sites, then a one-paragraph "Milestone E6b" NOTES.md entry. Strict TS,
`npm run typecheck` must pass (note: a pre-existing `vite.config.ts` `process.env` error is unrelated —
all `src/` must be clean). Do NOT commit.
```

---

## Task E6d — Performance re-verify
**Tier**: 2 → Sonnet · **Depends on**: P2b, P3b

```
You are in the Space ClickerZ repo (E:\Projects\Space ClickerZ): Vite + TS, Three.js with a 60-FPS
render cap, per-quality pixel-ratio caps, and half-res bloom (see NOTES.md "Performance pass").
Phase 2 + the Galaxy Rescope added denser visuals (bespoke era forms P2b, channel inflow) and a denser
GENERATORS panel (P3b: 22 sources × four pip rows each). Galaxy modifiers (G2) are sim-only (no extra
render cost).

## Read first
NOTES.md (the post-M10 "Performance pass" + Milestones P1/P2b/P3b and "Galaxy Rescope G2"),
src/render/scene.ts (FPS cap, pixel-ratio + bloom scale per quality), src/render/universe.ts,
src/render/particles.ts. The save schema is at v7 — seed saves via the current `defaultGameState()`
shape (it includes `galaxy` and `generatorUpgrades`); easiest is to develop a default save in-page.

<task>
Verify the game still holds ~60 FPS at a developed save across Low/Medium/High quality and with
reduced-motion, after the Phase-2 + Galaxy-Rescope additions. Use the Preview MCP: seed a late-game
save (several tiers unlocked + an era form active + the GENERATORS panel open with some pip upgrades +
hold-to-channel), measure frame timing, and check no console errors. If a setting regresses, make a
SMALL targeted fix (e.g. cap a particle/point count, gate an effect on quality/reduced-motion, or batch
a DOM update in the now-denser GENERATORS panel) — do not redesign.
</task>

<constraints>
- Don't change gameplay or balance. Keep changes minimal and quality/reduced-motion-aware.
- Preserve the existing FPS cap and quality scaling.
</constraints>

Output: any small perf fixes + a "Milestone E6d" NOTES.md entry with the measured before/after per
quality tier. Do NOT commit.
```

---

## Task E6c — Balance pass (do last)
**Tier**: 3 → Opus · **Depends on**: P2a, P2b, P3a, P3b

```
You are in the Space ClickerZ repo (E:\Projects\Space ClickerZ): a calm, AFK-friendly idle game.
Phase 2 + the Galaxy Rescope are feature-complete (longer ladder, generator pip upgrades with ~2
sources per tier, 5 discipline trees with big endgame globalMult capstone stacks, and per-run galaxy
run-modifiers). Time for the first real balance pass. Curves are first-pass throughout — this is
judgment work; the pillar is "never punishing, attention rewarded not required."

## Read first
docs/expansion/05-formulas.md (§Balance guard), the original BALANCING spec intent summarized in
NOTES.md, src/data/balance.ts, src/data/tiers.ts, src/data/generators.ts (now ~2 sources per tier),
src/data/generatorUpgrades.ts (the pip-band cost/effect table: `pipBand` cost constants +
`upgradeTracks` `effectPerPip`/`effectBandBonus` per track), src/data/galaxies.ts (the six G2 galaxy
run-modifiers — small per-run multipliers on production/scale/negentropy/channel/offline),
src/data/disciplines.ts (node costs/magnitudes — esp. the globalMult capstones: Matter ×3, Hunger ×1.5,
Void ×2 + ×5, and crossDisciplineMult), src/sim/prestige.ts (the locked prestige curve — do NOT change
its shape). Save schema is at v7.

## Goal
Tune node/upgrade/tier/pip/galaxy-modifier numbers so progression paces well and the stacked
multipliers (globalMult capstones × galaxy modifiers × pip tracks) don't trivialize the meta falloff —
without changing the prestige formula's SHAPE.

## Approach
1. Trace a full run with a fully-noded save: does Energy outpace tier costs so much that runs lose
   texture? Are the globalMult sources multiplying into absurdity?
2. Identify the few highest-leverage knobs (capstone magnitudes, pip-band growth in
   data/generatorUpgrades.ts, tier unlockCost ramp, generator cost-growth, and — only if they read as
   too strong — the galaxy modifier magnitudes in data/galaxies.ts) and adjust THOSE, not everything.
3. Re-verify pacing against the BALANCING targets; keep cost-reduction floors and the offline cap.

## Constraints
- Only data (src/data/) changes — no formula-shape changes in sim/. Keep the meta falloff and in-run
  sqrt DR intact. No timers/decay/failure (pillar).
- Prefer fewer, well-justified changes over a sweeping retune.

## Success criteria
- A fully-noded save no longer makes tier unlocks instant/textureless; the endgame globalMult stack is
  large-but-earned, not game-breaking.
- Early game still reaches the first Consume in a reasonable arc.
- Each change is justified in the NOTES entry (what knob, why, expected effect).

Output: the data tweaks + a "Milestone E6c" NOTES.md entry documenting each change and its rationale.
Do NOT commit.
```

---

# Galaxy Rescope (NEW — supersedes the "universe" framing)

The thing the Attractor grows and consumes is being rescoped from a **Universe** to a **Galaxy**
(more relatable, and there's far more real data on galaxies). **P2a and P2b already ran**, so this is
a retrofit of the existing ladder, NOT a fresh build.

**Reconciliation decision (locked):** keep all tier **ids + visualKeys + render forms** (saves and the
P2b forms survive) and only **reframe** the two universe-scale tiers to galaxy-internal:
`galaxies` → the galaxy's own structure (e.g. "Galactic Disk" / "Spiral Arms"); `clusters` →
"Globular Clusters" / "Star Clusters" (within the galaxy, NOT the Cosmic Web). Depth = reframe +
a galaxy-variety content layer (real morphologies/names/modifiers). No deep ladder rewrite.

**Order:** ✅ **G1 and G2 are both DONE.** G1 was pure naming/flavor (no save change); G2 added the
galaxy-variety state and bumped the save (v5→v6). The remaining balance pass (E6c) must account for the
G2 galaxy modifiers — that note is already folded into the E6c prompt above.

## Task G1 — Galaxy reframe + ladder reconciliation
**✅ DONE — do not re-run (kept for history).**
**Tier**: 2 → Sonnet · **Depends on**: P2a, P2b (already done)

```
You are in the Space ClickerZ repo (E:\Projects\Space ClickerZ): Vite + TS (strict) idle game. It is
currently framed as growing & consuming a UNIVERSE. The designer is rescoping the consumed unit to a
single GALAXY. The Complexity ladder (after P2a/P2b) is: quantum-foam → particles → atoms → molecules
→ nebulae → stars → galaxies → clusters → life → civilization → unknown. Two tiers are now
inconsistent with galaxy-scope: "galaxies" (you grow ONE galaxy) and "clusters" (currently the Cosmic
Web — larger than a galaxy).

## Read first
src/data/tiers.ts, src/data/comparisons.ts, src/data/facts.ts, src/data/survey.ts (note: clusters is
currently "COSMIC WEB / galaxies threaded along filaments"), src/ui/consumeButton.ts, src/ui/cycleLog.ts,
src/ui/surveyPanel.ts, src/ui/hud.ts, src/render/consumeFX.ts, README.md. Skim NOTES.md "P2a"/"P2b".

<task>
1. Reframe the prestige unit universe → galaxy everywhere it surfaces in player-facing copy: the
   Consume button ("CONSUME UNIVERSE" → "CONSUME GALAXY"), the survey panel title ("UNIVERSE SURVEY"
   → "GALAXY SURVEY"), the cycle log ("Universes consumed" → "Galaxies consumed" + the standing line),
   comparisons.ts (reword the Scale-comparison framing away from "your universe"; since the early
   ladder is pre-galactic matter, frame it as the forming/seed galaxy so "spans a single atom" still
   reads sensibly), facts.ts narration, and README flavor. Keep the entity "the Attractor".
2. Reconcile the two universe-scale tiers to galaxy-internal, changing ONLY display name + flavor
   (NOT ids or visualKeys): in tiers.ts rename "galaxies" to a galaxy-structure term (e.g. "Galactic
   Disk") and "clusters" to "Globular Clusters" (or "Star Clusters"); rewrite their survey.ts entries
   (clusters away from Cosmic Web → star clusters within the galaxy), their facts copy, and any
   comparison lines that referenced cosmic-web/inter-galactic scale.
</task>

<constraints>
- Do NOT change tier ids, visualKeys, the save schema, or any mechanic/balance number — this is pure
  naming + flavor, so no migration is needed and the P2b render forms keep working.
- Keep the cold, vast, eerie tone. No jokes.
</constraints>

## Success criteria
- No stray "universe" wording remains in player-facing copy (except deliberate cosmic flavor).
- The "galaxies" and "clusters" tiers read as galaxy-internal; survey.ts clusters no longer says
  Cosmic Web.
- npm run typecheck passes; the Consume button and survey show galaxy framing in the browser.

Output: the edits, then a "Galaxy Rescope G1" NOTES.md entry. Do NOT commit.
```

## Task G2 — Galaxy variety system (real morphologies + names + modifiers)
**✅ DONE — do not re-run (kept for history).** Shipped: `src/data/galaxies.ts` (6 archetypes + real
names + one modifier each), `src/sim/galaxies.ts` (modifier multipliers), `galaxy` on the schema
(v5→v6), wired into production/derive/actions/offline, `consume()` advances the galaxy, survey +
Consume-button UI. Modifier kinds: dwarf/spiral = production, irregular = scale, barred-spiral =
channel, lenticular = offline, elliptical = negentropy.
**Tier**: 3 → Opus · **Depends on**: G1

```
You are in the Space ClickerZ repo (E:\Projects\Space ClickerZ): Vite + TS (strict), decoupled
sim/render/ui, break_infinity.js currencies, data in src/data/. G1 reframed the consumed unit to a
GALAXY. Now add a galaxy-VARIETY content layer that leverages real galaxy data, so each run has a
distinct identity.

## Goal
Each run grows/consumes a galaxy with a real morphology + name + a SMALL run modifier, and the target
galaxy advances each Consume. Replay variety, real-data flavor. Correctness matters: it adds state +
a save migration and must not break the per-run reset semantics of Consume.

## Read first
docs/expansion/PHASE2-DEEPENING.md, src/sim/prestige.ts (consume() — exactly what it resets vs keeps,
and previewEntropyGain), src/state/schema.ts + src/state/migrations.ts (check the CURRENT SAVE_VERSION
— P2a and possibly P3a already bumped it; use the next number), src/data/disciplines.ts (effect
plumbing to reuse for modifiers), src/sim/production.ts, src/sim/derive.ts, src/ui/consumeButton.ts,
src/ui/surveyPanel.ts, src/data/survey.ts.

## Task
1. src/data/galaxies.ts — a table of galaxy ARCHETYPES by morphology (spiral, barred spiral,
   elliptical, lenticular, irregular, dwarf). Each archetype: a pool of REAL galaxy names (e.g.
   Andromeda/M31, Whirlpool/M51, Pinwheel/M101, Triangulum/M33, Sombrero/M104, M87, Centaurus A,
   Large/Small Magellanic Cloud, NGC 1300, Leo I…), a one-line eerie flavor blurb with a real-ish stat
   hook (diameter / star count), and ONE small run modifier (effect + magnitude). Suggested modifiers
   (keep them small and never punishing): spiral +production, elliptical +Negentropy/conversion,
   irregular small +variance, lenticular +offline or +Scale, dwarf faster-but-smaller, barred +channel.
2. State: add the current run's galaxy to GameState (archetype id + the chosen name). Bump
   SAVE_VERSION to the next number and add the migration (default = a starter archetype, e.g. a small
   spiral). The galaxy PERSISTS through the run and ADVANCES on Consume — it must NOT be cleared by
   consume()'s per-run reset; instead pick the next galaxy (a curated escalating order, or weighted
   random with no immediate repeat).
3. sim: apply the current archetype's modifier where its effect is computed (production / derive /
   prestige), reusing existing multiplier plumbing where possible. Expose a pure getter for the
   current archetype.
4. UI: show the target galaxy (name + morphology + blurb) in the GALAXY SURVEY panel; make the Consume
   button reference it (e.g. "◇ CONSUME — Andromeda"); on Consume, advance and surface the new galaxy.

## Approach
1. Lock the archetype data shape + the modifier vocabulary (prefer reusing existing effect types).
2. Work out the persist/advance semantics inside consume() precisely — currentGalaxy survives the
   reset and advances; verify nothing else regresses.
3. Implement, typecheck, then browser-verify: a Consume advances to a different galaxy and the new
   modifier takes effect; an old save migrates to the default galaxy.

## Constraints
- Modifiers small, data-driven, pillar-safe (calm/AFK; no punishment). currentGalaxy survives Consume.
- Do NOT change the prestige formula's shape. Strict TS, no any.

## Success criteria
- Each run shows a named real galaxy + morphology + blurb; its modifier measurably (but modestly)
  affects the run; Consume advances to a different galaxy; a pre-change save loads with the default
  galaxy; npm run typecheck passes.

Output: galaxies.ts + schema/migration + sim wiring + UI changes, then a "Galaxy Rescope G2" NOTES.md
entry (data shape, save version, modifier list, advance rule). Do NOT commit.
```
