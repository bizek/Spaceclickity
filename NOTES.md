# NOTES.md — deviations & decisions for the audit

Per CLAUDE.md "Definition of done": note deviations and the open decisions taken.

## Milestone 1 — Scaffold

**Status:** complete. Runnable (`npm run dev`), type-checks clean, no console errors.

### Open decisions taken (defaults per CLAUDE.md §"Known open decisions")
- **DOM overlay:** vanilla TS (no React). Hand-rolled reactive `Store` (no Zustand) to stay dependency-light.
- **Leaderboard:** local-only no-op default behind the `Leaderboard` interface; networked impl can swap in later.
- **Entity name:** kept "the Attractor".
- **Late "???" tier identity:** deferred; `visualKey: "unknown"` reserved, fact copy not yet written.

### Notes / deviations
- Dependency versions in `package.json` are caret ranges resolved at install time
  (Vite 6, TypeScript 5.7, Three 0.171). Adjust if the audit pins versions.
- `tsconfig` runs extra-strict beyond bare `strict` (`noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noUnusedLocals/Parameters`) per "No `any` in core systems".
- Sim/derive/prestige/production are typed **stubs** (return 0 / no-op). Real math
  lands in milestones 2–4; the function signatures are stable so callers don't churn.
- Render is a **blank canvas**: resizing renderer + locked perspective camera +
  near-black background only. Central object, starfields, nebula, bloom = milestone 5.
- Tap-to-channel button is wired as a no-op intent to prove the UI→store path;
  it grants no Energy until production exists (M2).
- `tiers.ts` unlock costs/weights are the BALANCING.md starting points, to be retuned.
- Save format is versioned (`saveVersion: 1`) with a `runMigrations` scaffold ready
  for the first schema change.

## Milestone 2 — State + sim core

**Status:** complete. Verified live in-browser (tap → buy → idle accrual →
localStorage persist → reload restores state), no console errors, type-checks clean.

### Notes / deviations
- **Generator curves moved to `data/generators.ts`** (one table per generator),
  mirroring `data/tiers.ts`. Removed the illustrative `generator` block from
  `balance.ts` to keep a single source per generator. `baseEnergyPerTap` stays in
  `balance.ts` as a global constant.
- Player intents live in `sim/actions.ts` (`tap`, `buyGenerator`, `costForN`,
  `maxAffordable`); UI emits them through the store, never mutating currencies.
- **Bulk buy is closed-form** (geometric series + log for max-affordable, no loops).
  Validated numerically against a brute-force reference across owned/count/energy
  ranges — exact match; `maxAffordable` always returns the largest affordable `k`.
- Production applies a `tierMultiplier` (product of owned-tier `energyMult`) so M3
  tier unlocks immediately boost both idle income and taps. Currently 1× (only
  Quantum foam owned).
- Offline/AFK catch-up still deferred to **M8** — the sim accumulator only catches
  up within a live session, so reloads don't grant offline gains yet (no double-count).
- `break_infinity.js` CJS require returns the constructor directly (no `.default`);
  noted for any future Node-side tests/tooling.

## Milestone 3 — Core loop (per-run)

**Status:** complete. Verified live (fresh start → unlock Particles: Energy −100,
Scale 2→12, Negentropy 1.41→9.41, Atoms becomes next, Quark lattice generator
revealed, fact-particles unlocked). Type-checks clean, no console errors.

### Model chosen (data-driven)
- **Tier ladder = sequential binary unlocks.** `unlockTier` pays `unlockCost` in
  Energy, requires the previous tier unlocked, sets `tierLevels[id] = 1`, and adds
  the tier's `factId` to `unlockedFacts`. `nextUnlockableTier` drives the UI's
  single buyable row (buy / owned / locked states).
- **One generator per tier** (`data/generators.ts`, `generatorsForTier`). A tier's
  generators are hidden until that tier is unlocked. Buying them both produces
  Energy and *develops* the tier.
- **Derived Scale/Negentropy** (`sim/derive.ts`, pure):
  - `Scale = baseScale * Σ unlocked ( scaleContribution * (1 + progress) )`
  - `Negentropy = Σ unlocked ( negentropyWeight * √(1 + progress) )`
  - `progress` = generators built within the tier. Unlocking bumps both; building
    generators grows them smoothly. √ gives the spec's gentle concave ripeness.
- Production's existing `tierMultiplier` (product of owned-tier `energyMult`) now
  actually scales income as you climb.

### Notes / deviations
- Generator base costs/production per tier are first-pass starting points for the
  audit to retune toward BALANCING §9 pacing targets.
- "Tier development" is modeled via generator count (not a separate level buy),
  keeping one purchase mechanic. Can split later if the audit wants distinct
  "develop tier" spending.
- Seeded `fact-quantum-foam` into `defaultGameState.unlockedFacts` (the spark is
  "reached" at the Big Bang) so the cycle-log counter is coherent from t=0.
- Added the remaining tier-reached facts as first-pass copy so `facts (x/7)` reads
  sensibly now; full eerie fact content + Scale/cycle-triggered facts are M7.
- **Test note:** the `visibilitychange` autosave fires during a same-tab
  `reload()`, so `localStorage.clear()`/`removeItem` before a reload gets clobbered
  by the in-memory state. This is correct runtime behavior; for clean-slate testing
  seed the save and neutralize `setItem` before reloading. Not a game bug.

## Milestone 4 — Prestige loop (MVP complete)

**Status:** complete. MVP (milestones 1–4) is a fully playable
grow → consume → upgrade → repeat loop. Verified live and against hand-calc.

### Formula (BALANCING §6), implemented in `sim/prestige.ts`
- `entropyGain = K · conversionMult · √(Negentropy / softcap)` (in-run DR)
- `effectiveGain = entropyGain · 1 / (1 + totalEntropy/metaSoftcap)^p` (meta falloff)
- Verified: a seeded ripe universe (Negentropy 242.80, Entropy 0) → gain 0.16,
  exactly matching the formula with the §11 starting constants.

### What Consume does
Banks `effectiveGain` Entropy, increments `cycle`, and resets **per-run** state
only (energy, generators, tierLevels→quantum-foam, upgrades). Entropy, prestige
upgrades, `unlockedFacts`, cycle count, and settings persist.

### Permanent (Entropy) upgrades (`data/prestigeUpgrades.ts`, first pass)
- **Deepening Hunger** — energyMult ×1.5/level (applied in `production` + taps).
- **Wider Maw** — conversion (K) ×1.25/level (applied in `previewEntropyGain`).
- **Entropic Erosion** — tier unlock cost ×0.9/level (applied via
  `effectiveUnlockCost`, shown discounted in the tier panel).
- Verified: buying Deepening Hunger took Energy/s 12.88K→19.32K (×1.5) and
  persisted through a Consume.

### Notes / deviations
- New UI: `ui/prestigeUpgradePanel.ts` ("ATTRACTOR" panel) mounted in the right
  column; Consume button shows live preview gain.
- Module deps stay acyclic: `production`→`prestige`→`derive`→`data`;
  `actions`→{`production`,`prestige`}. No cycles.
- Consuming a *fresh* universe yields a trivial ~0.01 Entropy (Negentropy floor of
  1 from owning Quantum foam). Harmless — DR makes looping empty universes
  pointless — but the audit may want a minimum-ripeness gate on the button.
- No confirmation dialog on Consume yet (it's the core idle prestige action);
  add one in polish if playtests want it.
- Per-run upgrades (`data/upgrades.ts`) intentionally still empty; not required for
  MVP. Can be filled alongside M7 content.

## Milestone 5 — Render

**Status:** complete. Verified live (Stars era: cold-blue cloud + gold core;
Life era: bioluminescent teal) — central object morphs by era, bloom glow,
parallax starfields + nebula, HUD frames the canvas. No WebGL/console errors.

### Structure
- `render/scene.ts` — orchestrator: renderer, `EffectComposer` + `UnrealBloomPass`,
  locked slow auto-orbit camera + eased pointer parallax, per-frame `update` of the
  subsystems from `store.get()`. Returns a handle exposing `universe`/`attractor`
  for the Consume FX (M6).
- `render/universe.ts` — `Universe`: a fuzzy-sphere particle cloud + glow-sprite
  core. Era visual params (color/radius/size/spin) per `TierVisualKey`, lerped each
  frame for smooth morphs. Group scale is log-compressed from derived Scale so the
  universe "fills" the frame as it grows.
- `render/particles.ts` — `Starfield`: 3 Points layers (far/mid/near) with
  parallax + slow spin, plus dim haze sprites for nebula.
- `render/attractor.ts` — `Attractor`: dark void sprite (normal-blended negative
  space) + faint additive rim at the lower-left edge; size grows with Entropy/cycle.
  `bump()` reserved for the Consume FX.
- `render/textures.ts` — procedural canvas gradient textures (glow/haze/void), no
  asset files.

### Notes / deviations
- Imports use `three/examples/jsm/...` (has `@types/three` typings; `three/addons`
  resolves to the same files but typings are less certain).
- Three.js bundles to ~520 kB (gzip ~132 kB) → Vite's >500 kB chunk warning. Benign
  for a single-page game; could code-split/manualChunks later if desired.
- Particle counts and bloom strength scale with `settings.quality` at init; live
  quality switching (rebuild) lands with M9 settings.
- Nebula is lightweight haze sprites rather than a full fBm/curl-noise shader
  (VISUAL_SPEC §5 ideal). Cheap and on-mood; can upgrade to a shader later.

## Milestone 6 — Consume FX

**Status:** complete. Verified live: clicking Consume played the devour FX, then
under the fade banked Entropy (100→100.17), advanced cycle (3→4), reset the run,
set `seenConsumeFX`, and persisted. v1→v2 migration loaded with no errors.

### How the action flows (keeps separation intact)
UI emits a plain `onConsume` callback → `main.ts requestConsume()` reads the
preview gain, then calls `scene.playConsume(onApply, skip)`. The render-owned
`ConsumeFX` runs the timeline and, at the fade peak, invokes `onApply` which does
the actual `store.update(consume)` (game logic stays in sim/). The FX owns the
universe group transform while active; `scene` suppresses the normal universe
update for that span and hands control back cleanly at the end.

### Details
- Timeline (~2.6s): stillness → pull toward Attractor (contract + spin up) →
  collapse + `#fx` fade-to-black → state resets under cover + `attractor.bump()` →
  fade lifts to reveal a new smaller spark. Camera leans in slightly.
- `#fx` is a DOM black overlay (z-index above canvas, below nothing interactive);
  its opacity is driven by `ConsumeFX`.
- **Skip after first viewing:** `settings.skipConsumeFX` (default off) + persisted
  `seenConsumeFX`. When both true, a 0.35s quick-fade path is used. Toggle UI is M9.
- **Save schema v2:** added `seenConsumeFX` and `settings.skipConsumeFX`;
  `migrations[1]` backfills both. Confirmed old v1 saves load fine.
- Consume now also saves immediately (key event) in addition to the interval.

## Milestone 7 — Content & juice

**Status:** complete. Verified live: unlocking Particles fired a fact popup
("First matter") + a Scale comparison popup ("spans a single atom"), the
comparison line updated, facts counter 2/12, and the cycle log opened showing
unlocked facts + 10 redacted entries with the correct tally.

### Pieces
- `data/comparisons.ts` — log-spaced Scale comparison strings (escalating →
  unsettling) + `comparisonIndexFor(scale)`.
- `data/facts.ts` — added Scale-threshold and cycle-count facts (the eerie "they
  remember" flavor). 12 facts total.
- `sim/unlocks.ts` — `checkFactUnlocks(state)` evaluates every fact trigger
  (tier/scale/cycle) each tick and appends newly met ids. Centralizes unlocking;
  removed the ad-hoc push from `unlockTier`.
- `ui/notifications.ts` — watches `unlockedFacts` growth + Scale comparison index,
  shows dismissible auto-fading slide-in popups, fires sound cues. Baselines from
  loaded state so it never spams on load.
- `ui/cycleLog.ts` — the label is now a button opening a modal log: consumed-count
  tally, current comparison, and all facts in canonical order (redacted until
  observed, re-readable after).
- `services/audio.ts` — `audio.cue(tap|unlock|milestone|consume)`; tiny WebAudio
  synth (low drones, sub-bass on Consume, high glints on milestones). Disabled by
  default; lazily creates `AudioContext` on first cue after a gesture. The settings
  toggle lands in M9.

### Notes
- Per-run upgrades (`data/upgrades.ts`) still intentionally empty (optional content).
- Audio default-off means the cue paths are exercised only once enabled; verified
  the hook call sites, not audible output.
