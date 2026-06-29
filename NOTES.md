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

## Milestone 8 — Offline / AFK progress

**Status:** complete. Verified live: a save 1h old granted exactly 46.37M Energy
(= rate 12.88K/s × 3600) with popup "Away 1h 0m…"; a 100h-old save clamped to 12h
→ 556.42M with the "(the Attractor was patient only so long)" tail.

### Implementation
- `sim/offline.ts applyOfflineProgress(state, now)` — `elapsed = now − lastSaved`,
  clamped to `balance.offline.capHours` (12h), `gained = rate × seconds ×
  efficiency` (100%). Stamps `lastSaved = now`. Returns `{seconds, gained, capped}`
  or null.
- `main.ts` runs it right after load (before subscribers mount) so the first paint
  already reflects the catch-up, then shows the AFK popup via `notify(...)`.
- `ui/notifications.ts` now exposes `notify()` + a shared lazy popup container.
- `util/format.ts formatDuration()` for "Xh Ym" style.

### Notes
- No double-count: offline runs once on load; the live sim accumulator starts from
  `performance.now()` at boot, independent of `lastSaved`.
- The `offlineBoost` prestige effect type exists but no upgrade uses it yet; offline
  efficiency is the flat `balance.offline.efficiency`. Easy to add later.
- **Testing caveat:** seeding a past `lastSaved` then reloading repeatedly while
  `setItem` is locked re-applies the grant each reload (lastSaved never persists),
  which inflated an intermediate reading during development. A single clean load
  grants exactly once (verified).

## Milestone 9 — Settings & a11y

**Status:** complete. Verified live: notation toggle reformats readouts
(123.46M ↔ 1.23e8); quality change rebuilds the scene with no errors; sound +
quality persist; export decodes to v3; v2→v3 migration backfills `sound`.

### Pieces
- `ui/settingsPanel.ts` — modal with quality (Low/Med/High), number format,
  reduced-motion, sound, skip-Consume-FX, instability (opt-in) toggles, plus
  export (copy string), import (paste → reload), and a two-click reset.
- `main.ts` — binds `settings.sound` → `audio.setEnabled`; on `settings.quality`
  change, `scene.stop()` + re-`initScene` (particle counts/bloom are init-time).
  `scene` is held mutably; `requestConsume` reads the current instance.
- `state/store.ts` — added `replace(next)` for import/reset.
- Save schema **v3**: `settings.sound` (default off) + `migrations[2]` backfill.

### Notes / deviations
- Reduced-motion and notation apply live (read each frame / each subscribe);
  quality requires a rebuild (counts are baked at init).
- **Instability** toggle persists the flag but has no gameplay effect yet — the
  hard-mode mechanic is intentionally future work (GAME_DESIGN §8: spec it, gate
  it). Labeled "opt-in".
- Import/reset use `location.reload()` after persisting so the scene and audio
  re-init cleanly from the new state.
- Settings persist immediately on change (`saveGame` in `setSetting`).

## Milestone 10 — Leaderboard (optional, pluggable)

**Status:** complete (local-only, as defaulted). Verified live: on-load submit
wrote the leaderboard key (best=5,000,000); the cycle log shows
"The Attractor's vastness (Entropy): …"; after a lower-Entropy run the standing
appended "— best 5.00M" (records persist independently of resets).

### Implementation
- `services/leaderboard.ts` — `Leaderboard` interface (`submitScore`, `getGlobal`,
  `getFriends`) + `localLeaderboard` default that persists the best total Entropy in
  its own localStorage key. Exported `leaderboard` binding is the swap point for a
  networked impl (treat client scores as untrusted server-side — v1 limitation).
- `main.ts` submits on load, on each autosave tick, and inside the Consume
  `onApply`.
- `ui/cycleLog.ts` shows the standing; appends the local best when it exceeds the
  current total.

### Notes / deviations
- "Global"/"friends" are local in v1 (getFriends returns []). The networked backend
  is intentionally out of scope per TECH_ARCHITECTURE §7 / open decision (local-only).
- Secondary boards (peak Scale, most universes consumed) are not implemented; the
  interface/storage can be extended without touching callers.

---

## Project status: all 10 milestones complete

The game is feature-complete against the four specs and CLAUDE.md build order.
Outstanding follow-ups for the audit (all noted above):
- Balance pass toward BALANCING §9 pacing targets (curves are first-pass).
- Optional: minimum-ripeness gate on Consume (currently a fresh universe yields a
  trivial ~0.01 Entropy — harmless due to diminishing returns).
- Optional: per-run upgrades (`data/upgrades.ts` is an empty, wired stub).
- Optional: instability hard-mode mechanic (toggle persists; no gameplay effect yet).
- Optional: networked leaderboard; nebula fBm shader; code-splitting the Three.js chunk.

## Performance pass (post-M10)

User reported poor performance. The render loop was uncapped (measured 165 FPS in
preview) — on high-DPI displays / integrated GPUs that pegs the GPU running an
expensive bloom pass at up to 2× pixel density. Fixes (all in `render/`):

- **Frame-rate cap at 60 FPS** (`scene.ts`) — `composer.render()` is gated by a
  timestamp; rAF still fires at vsync but skipped frames just early-return. ~64%
  fewer GPU renders on a 165 Hz display; dt/elapsed advance only on rendered frames
  so animation speed is unchanged.
- **Pixel-ratio cap per quality** — low 1, medium 1.25, high 1.5 (was up to 2).
  Fill-rate scales with the square of this, so this is the biggest high-DPI win.
- **Bloom at reduced resolution** — render targets at 0.6× (high) / 0.5× (others)
  of canvas. Bloom is blurry anyway; visually ~identical, much cheaper.
- **Particle counts** — kept Low/Med lighter; High restored to a rich density
  (universe 3200, starfields 1700/850/280) after the real cause turned out to be
  Brave's hardware acceleration, not the workload. Capable hardware gets the lush
  look; Low/Med remain the lighter fallbacks.

> Root cause of the original report: **Brave with hardware acceleration off**
> (software WebGL) — brutal when the canvas is maximized on a 1440p display, and it
> starved other Brave tabs. Chrome (HW accel on) runs it buttery smooth. The render
> optimizations above are still net-positive (the FPS cap notably reduces the
> GPU contention that was slowing other tabs).

Also switched **the launcher to serve the production build** (`npm run build` then
`npm run preview --port 5173 --open`) instead of the dev server — lighter JS, no
HMR overhead, faster load. Same port 5173 so localStorage saves carry over.

Verified: scene still renders correctly after trims; production preview serves 200.
If still heavy on the user's machine, Settings → Quality → Low (PR 1, fewest
particles, weakest bloom) is the fallback.

---

# EXPANSION — design docs in `docs/expansion/`

A major expansion (passive trees + EVE/X4 command-console UI) was planned through the
game-dev methodology. Locked direction: **aesthetic & UI only** (calm/AFK loop unchanged),
**multiple themed "Discipline" trees**, nodes **spend Entropy directly** (the 3 prestige
upgrades fold into tree roots), **design docs first**. Full spec set + build milestones
E1–E6 in `docs/expansion/`. The expansion is a superset of the base game; sim/render/ui
separation and the data-driven model are untouched.

## Milestone E1 — Console shell (UI reskin)

**Status:** complete. Verified live (seeded universe: 4 panels mount, live readouts, collapse
persists, no console errors, type-checks clean). **Pure presentation — zero game-logic or
save-schema change.**

### Pieces
- `ui/console/panel.ts` — reusable collapsible `createPanel({id,title})` framework. Collapse
  state persists to its **own** localStorage key (`console.panels.v1`), keeping `GameState`
  sim-only until the v4 schema lands in E3. a11y: title is a real `<button>` with
  `aria-expanded`/`aria-label`.
- `ui/console/frame.ts` — chrome layer (schematic grid, animated scanlines, 4 viewport corner
  brackets). Inserted as a sibling **before** `#hud` (z-index: canvas → frame 1 → hud 2 → fx 50).
  Subscribes to settings: `is-low` drops scanlines on Low quality, `is-reduced` freezes them on
  reduced-motion (plus the `prefers-reduced-motion` media query).
- `ui/hud.ts` — reworked into a **dock layout**: left dock (COMPLEXITY) + right dock stacking
  READOUT / GENERATORS / ATTRACTOR, each wrapped in a console `Panel`. Center column stays clear
  for the WebGL universe. All existing mount fns reused unchanged (they append into a panel body).
- `generatorPanel.ts` / `prestigeUpgradePanel.ts` — dropped their internal `hud-panel-title`
  h2 (the console Panel owns the title now); removed the now-unused `makeTitle` helper
  (`noUnusedLocals`).
- `style.css` — console tokens (`--console-grid/scan/bracket`, `--panel-bar`), the `.panel`
  framework (title bar, caret, corner ticks, collapse), `.console-dock` (scrollable flex column),
  and the `.console-frame` chrome.

### Notes / deviations
- **Screenshot caveat (tooling, not a bug):** the Preview MCP `preview_screenshot` times out
  while the full-viewport scanline animation runs; pausing CSS animations lets the capture
  succeed. The game itself runs clean at the 60-FPS cap. Verified layout via `preview_inspect`/
  `preview_eval` + a paused-animation screenshot.
- Collapse persistence is deliberately **outside** `GameState` (own localStorage key) to avoid a
  schema bump in a pure-UI milestone; can migrate into `GameState.panelState` at E3 if desired.
- No new panels yet: Telemetry/Survey are E2 (gated by Mind nodes), the Disciplines tree is E3.
  E1 only restyles what exists into the console frame.
- Old `.hud-panel`/`.hud-left`/`.hud-right` CSS rules are now dead (markup uses `.console-dock`)
  but left in place; harmless. Can prune later.

## Milestone E2 — Telemetry & Survey panels

**Status:** complete. Verified live (Stars-era seed: survey reads STELLAR NURSERY, 3 telemetry
sparklines drawing live with the headline values, no console errors, type-checks clean). Pure
read-only instruments — **no game-logic or save-schema change.**

### Pieces
- `data/survey.ts` — per-era faux-scan copy (`surveyByEra` keyed by `TierVisualKey`): dominant
  structure, classification, optional `redacted` flag, optional `lifesign` (Life/??? only). Eerie
  register (P2); `█` blocks are intentional "redacted readout" glitches.
- `ui/telemetryPanel.ts` — UI-side ring buffer (`MAX_SAMPLES=120`) of **log10** samples for
  Energy/s, Scale, Negentropy (values grow exponentially, so log + per-window normalization keeps
  the trend legible). Sampling on a fixed cadence (500ms; 1000ms on Low/reduced-motion), drawing
  rAF-throttled to one canvas per metric with a live dot. **Never** touches `GameState`. Headlines
  update on every state change; sparklines on the cadence. dpr-aware canvas sizing (capped at 2).
- `ui/surveyPanel.ts` — current era = highest unlocked tier; renders ERA/STRUCTURE/SCALE/CLASS
  lines + a conditional LIFESIGN line. Reads `surveyByEra` + `deriveScale` + the Scale comparison
  (as a tooltip on STRUCTURE).
- `ui/hud.ts` — mounts TELEMETRY + UNIVERSE SURVEY into the **left** dock under COMPLEXITY
  (instruments cluster left; right dock keeps READOUT/GENERATORS/ATTRACTOR). Balances the layout.
- `style.css` — `.telemetry`/`.tele-*` and `.survey`/`.survey-*` styling; a `▮` blink on the
  survey status (disabled under `prefers-reduced-motion`).

### Notes / deviations
- **Always-visible in E2.** The design gates Telemetry/Survey behind Mind discipline nodes
  (`panelUnlock`), but those don't exist until E3. The panel must exist before a node can unlock
  it, so E2 ships them on; E3 flips them to gated. Marked with a comment in `hud.ts`.
- Telemetry lines read low/flat over a short window of slow idle growth (log10 barely moves);
  they step visibly on tier unlocks / bulk buys. Optional polish: area-fill under the line.
- `preview_screenshot` still needs CSS animations paused to capture (now also the survey blink) —
  tooling artifact, game runs clean.

## Milestone E3 — Discipline framework + Matter & Hunger trees

**Status:** complete. First non-cosmetic expansion milestone. Verified live: v3→v4 migration lands
legacy upgrade levels on the right nodes, buying a node spends Entropy + unlocks its dependents +
moves the wired effect, tree gating/edges render per tab. Type-checks clean, no console errors.

### Pieces
- `data/disciplines.ts` — `DisciplineDef`/`NodeDef`/`NodeEffect` (effects **array**), `DisciplineId`
  (all 5 reserved), full **Matter (6)** + **Hunger (5)** node data with positions/costs/requires.
- `sim/disciplines.ts` — aggregator (depends only on data + state, stays acyclic): `nodeEffectProduct`
  (multiplicative magnitude^level), `hasUnlock`, convenience mults (`genCostMultiplier` floored at
  0.05, `tapMultiplier`, `negentropyWeightMultiplier`, `globalMultiplier`, `metaSoftcapMultiplier`,
  `tierEnergyMultiplier` with "<tier>+" group matching), `nodeCost`, `prereqsMet`, `isNodeMaxed`,
  `canBuyNode`, `buyNode`.
- **Save schema v4** (`schema.ts`) — added `disciplines: Record<string,number>`; kept legacy
  `prestigeUpgrades` field (now always `{}`) for rollback safety. `migrations[3]` folds
  `hunger→matter.deepening-hunger`, `erosion→matter.entropic-erosion`, `maw→hunger.wider-maw`
  (levels preserved), then empties the legacy map. **Verified**: a seeded v3 save (hunger3/maw2/
  erosion1) migrated to Deepening Hunger Lv3 / Entropic Erosion Lv1 / Wider Maw Lv2 with matching
  next-level costs and identical effective multipliers.
- **Effect wiring** — `prestige.ts`: the three multipliers now delegate to the aggregator (energyMult
  ×globalMult; betterConversion; cheaperTiers); `previewEntropyGain` adds `metaSoftcapRaise` (softens
  the meta falloff) + `minRipenessFloor` (floors the in-run ratio at 1). `production.ts`: per-generator
  `tierEnergyMultiplier`. `derive.ts`: `negentropyWeightMultiplier` on Negentropy. `actions.ts`:
  `tapMultiplier` on tap; `effectiveGenCost` + `maxAffordableFor` apply `genCostMultiplier`.
  `generatorPanel.ts` uses the effective cost/max so displayed price matches charged price.
  **Verified**: Dense Packing dropped a generator's Buy×1 from 452.59 → 416.39 (×0.92).
- `ui/disciplinePanel.ts` — dock panel (Entropy + launcher) + modal overlay: discipline tabs, each
  tree rendered from data (SVG prereq edges + absolutely-positioned node buttons keyed off
  `NodeDef.position`), node states owned/available/locked/unaffordable, a detail footer, `buyNode`
  intent. Accent driven by `--disc-accent`. Esc/backdrop/✕ close; node states refresh on store
  updates while open. `hud.ts` swaps the old ATTRACTOR panel for DISCIPLINES.
- Removed `ui/prestigeUpgradePanel.ts` and `data/prestigeUpgrades.ts` (fully superseded).

### Notes / deviations
- **`effects` is an array** (not the single `effect` field the architecture doc sketched). Needed for
  multi-effect capstones (The Long Devour = betterConversion ×2 **+** globalMult ×1.5); strictly more
  capable, aggregator iterates the array.
- **DISCIPLINES panel placed in the right dock** (the old ATTRACTOR slot) rather than left as the doc
  diagram showed — keeps the E1/E2 left/right balance (left already holds COMPLEXITY/TELEMETRY/
  SURVEY). Easy to move later.
- **`minRipenessFloor` interpretation:** floors the in-run `Negentropy/softcap` ratio at 1 when owned,
  so a Consume never converts at a sub-softcap loss. Magnitudes/costs are first-pass (E6 balance pass).
- `prestige.ts` no longer exposes `buyPrestigeUpgrade`/`prestigeUpgradeCost`; purchase logic lives in
  `sim/disciplines.ts buyNode`/`nodeCost`. Dead `.prestige-*` CSS left in place (harmless).
- E4 will populate Time/Mind/Void (ids reserved) and gate Telemetry/Survey behind Mind `panelUnlock`
  nodes (the E4 effects — offline/automation/QoL/void — are already in the `NodeEffect` union).

## Milestone E4 — Time, Mind & Void trees + cross-discipline scaling

**Status:** complete. Verified live: all 5 trees render; the new *scalar* effects move the numbers;
cross-discipline scaling activates when a capstone in another tree is owned; cross-capstone gating
holds. Type-checks clean, no console errors.

### Pieces
- `data/disciplines.ts` — added **Time** (5), **Mind** (6), **Void** (4) nodes; `disciplines` export
  now lists all five. Void's `what-remains` capstone `requires` the four other capstones (the
  cross-capstone gate) plus its own two prereqs.
- `sim/disciplines.ts` — new aggregators: `nodeEffectSum` (additive, for offline cap/efficiency),
  `tickRateMultiplier`, `offlineCapHoursBonus`, `offlineEfficiencyBonus`, `capstoneOwned`, and
  `crossDisciplineMultiplier` (each crossDisciplineMult node scales by the count of OTHER disciplines
  whose capstone is owned). Capstone-per-discipline index built once.
- **Effect wiring:** `prestige.ts prestigeEnergyMultiplier` now also folds in
  `crossDisciplineMultiplier`. `production.ts energyPerSecond` multiplies in `tickRateMultiplier`
  (idle only — not taps). `offline.ts` adds `offlineCapHoursBonus` to the cap and
  `offlineEfficiencyBonus` to efficiency, the latter clamped to `MAX_OFFLINE_EFFICIENCY = 2.0`.
- `style.css` — `.disc-tabs` wraps (five tabs).
- UI: no code change — the overlay renders every discipline from data, so three tabs appeared for free.

### Verified (seeded Entropy 1e8, Stars era)
- 5 tabs Matter/Hunger/Time/Mind/Void; each tree lays out and gates correctly.
- **tickRateMult:** Quickened Tick took Energy/s 13.05M → 19.57M (×1.5); offline nodes left Energy/s
  unchanged (correct — they only touch the AFK path).
- **globalMult:** Hollow Resonance 19.57M → 39.14M (×2).
- **tierEnergyMult:** Stellar Forge doubled only the Stars-tier producer.
- **crossDisciplineMult (the headline):** buying out Matter to Mass Without End took 75.59M → 340.14M
  = ×4.5 = ×3 (Mass Without End globalMult) × ×1.5 (The Pattern, now seeing one owned capstone in
  another tree). The Void node retroactively scaled off the Matter capstone. ✓
- What Remains stays locked behind the four-capstone gate.

### Notes / deviations
- **Unlock-effect *consumers* deferred to E5** (per the build plan): `autoBuyGenerators`, `panelUnlock`,
  `revealComparisons`, `factHint`, `bulkBuyUnlock` ship as **buyable data** but are currently inert —
  e.g. Telemetry/Survey remain always-visible until E5 gates them, generators already have Buy×Max.
  E5 wires these.
- **`instabilitySynergy` (Void: Unmaking) is intentionally inert** for now: the Instability hard-mode
  mechanic itself is still unbuilt (a long-standing GAME_DESIGN follow-up), so wiring a bonus to the
  toggle would be free power. The node exists; its effect lands when Instability gets real downsides.
- Offline efficiency can now exceed 100% (Steady Drip / Outside Time) — deliberate AFK reward, hard-
  capped at 200%. First-pass magnitudes; E6 balance pass.
- Endgame `globalMult` stacks (Matter ×3, Hunger ×1.5, Void ×2 + ×5) are large by design and gated
  behind the full capstone web; flagged for the E6 balance pass.

## Milestone E5 — Unlock-effect consumers (automation + QoL)

**Status:** complete. Makes the E4 unlock nodes live. Verified live: every unlock effect fires.
Type-checks clean, no console errors.

### Pieces (each wires one `NodeEffect` unlock)
- **`autoBuyGenerators`** (Time: Clockwork Hands) — `actions.autoBuyCheapest(state)`: buys ONE unit of
  the cheapest affordable unlocked-tier generator; called each `tick.ts` step. Gentle by design
  (1/tick ≈ 10/s) so idle income still accumulates toward tier unlocks (no progression starving).
  **Verified:** generators auto-climbed (Vacuum fluctuation ×40→×107, Quark lattice ×32→×75, …).
- **`panelUnlock`** (Mind: Telemetry Array / Deep Survey / Total Recall="all") — `hud.ts gatePanel`
  hides Telemetry/Survey until the matching Mind node (or "all") is owned. **Verified:** both
  `display:none` with no Mind nodes, reappear immediately on purchase.
- **`revealComparisons`** (Mind: Clear Optics) — `hud.ts` adds a dim `next ▸ …` line previewing the
  next Scale comparison. **Verified:** showed "next ▸ The span of a small, cold moon."
- **`factHint`** (Mind: Echoes) — `cycleLog.factHintText` turns each unobserved fact's trigger into an
  "Echo: reach the Galaxies tier." / "Echo: grow Scale beyond 100.00M." / "Echo: consume 10 universes."
  **Verified** across all three trigger kinds.
- **`bulkBuyUnlock`** (Mind: Bulk Channeling) — `generatorPanel` shows a gated **Buy ×10** button
  (between ×1 and Max). Non-regressive: ×1 and Max stay always-available (base game had Max), the node
  only *adds* the ×10 middle option. **Verified:** 3 buttons/row after purchase.
- `style.css` — `.hud-comparison-next` and `.log-fact.is-hinted` styling.

### Notes / deviations
- **`bulkBuyUnlock` = additive ×10** rather than gating Max (which the base game has always had);
  removing Max would regress existing saves. Documented divergence from the doc's "enable ×10/Max".
- **Auto-buy = cheapest affordable** (per the design). Open tuning Q from DISCIPLINES.md (reserve for
  tier unlocks) is moot in practice since it buys only 1/tick; revisit only if E6 playtests dislike it.
- `instabilitySynergy` remains the one intentionally-inert unlock (depends on the unbuilt Instability
  hard-mode) — untouched by E5.
- All five trees and every non-instability effect are now fully functional. Remaining: **E6** polish
  (console boot sequence, sound cues, balance pass, perf re-verify across quality tiers).

---

# PHASE 2 — Deepening (design: docs/expansion/PHASE2-DEEPENING.md)

From designer notes. Locked: generator pip-upgrade matrix (Rate/Efficiency/Mass/Density, **per-run
Energy**); ladder expansion (fill gap + extend high-end); **build first = hold-to-channel + atom
visual**. Order: P1 channeling/visuals → P2 ladder → P3 generator pips → fold in E6 polish.

## Milestone P1 — Channeling & Living Visuals

**Status:** complete, verified by live render-state inspection (screenshot capture was returning
stale frames mid-reload; values confirmed via a temporary debug handle). Type-checks clean, no errors.

### Pieces
- **Hold-to-channel replaces tap.** `balance.baseChannelPerSecond` (8) + `channelRampSeconds` (1.6);
  `actions.channelRate` (= base × tier × prestige × tapMult) + `actions.channel(state, s, intensity)`.
  Catalytic Spark (`tapMult`) re-reads as the channel multiplier (copy updated, effect key unchanged).
- `render/channeling.ts` — transient `{active, intensity}` singleton (NOT in GameState), written by UI,
  read by render.
- `ui/channel.ts` — pointerdown/up/leave + keyboard hold; rAF ramp (spin-up/decay); flushes channel
  Energy at ~20 Hz (not 60) to avoid spamming HUD subscribers; mirrors ramp to the singleton.
- `ui/hud.ts` — center `hud-channel` zone (fills center, over the canvas) with a fading "hold to
  channel" hint, replacing the tap pill. Removed the now-unused `audio` import (moved to channel.ts).
- `render/universe.ts` — **channel inflow** (per-quality Points dragged inward, phase^1.4 gravity
  accel, opacity eased to intensity; core brightens/grows ×(1+0.7·intensity)) + the **atom form**
  (nucleus sprite + 3 tilted orbital `LineLoop`s with orbiting electron sprites, `depthTest:false`);
  fades in at the Atoms era and dims the diffuse cloud to 18% so it reads as an atom.
- `style.css` — `.hud-channel` / `.hud-channel-hint`.

### Verified
- Channel: held the zone → Energy 0 → 464 (ramping), stops on release. `is-channeling` toggles.
- Atom form (state-inspected at Atoms era): `atomOpacity→1.0`, cloud opacity `0.18`, 3 orbitals at
  `0.8`, atom visible. No console errors; tsc clean.

### Notes / deviations
- `tap()` removed from the HUD; the channel path supersedes it (the `baseEnergyPerTap` constant is now
  legacy/unused but left in balance).
- **Open visual question (needs the designer's eye):** orbital rings are 1px `LineLoop`s — WebGL
  ignores line width, so they may read thin against bloom. If too faint, switch rings to loops of small
  glow points (dotted) for a punchier, bloom-friendly look. The bright electron sprites should read
  regardless.
- `preview_screenshot` proved unreliable here (stale frames while the page hot-reloaded); verified via
  live `window.__uni` state instead (debug hook added then removed).
- Bespoke forms for the other eras (molecules/nebula/stars/galaxy/life) come with their tiers in P2/P3.

### P1 follow-up — atom bugfix + visual rework (from playtest feedback)
Designer playtested: channeling felt good but wanted curved/colored infall; **atom rings + electrons
were invisible.** Root cause (found via a `window.__uni` debug handle): `makeOrbital` built each
orbital group but **never added it to `this.atom`** — the rings/electrons were orphaned (world matrix
stuck at origin), so nothing rendered regardless of styling. Fixed by `this.atom.add(orbital.group)`
in the constructor loop. Confirmed: `atom.children` 1→4, electron at a real world position, rings +
electrons now clearly visible (3 dotted orbital ellipses + blue-white electrons around the nucleus).

Same pass reworked the visuals per feedback:
- **Atom:** orbital rings are now loops of **glow point-sprites** (not 1px `LineLoop`s, which WebGL
  can't widen); the diffuse cloud now **contracts** (`points.scale → 0.4`) as well as dims (`→0.12`)
  so the atom dominates; electrons tuned to scale 0.24.
- **Channel inflow:** particles spawn **off-screen** (2.7× radius) and **spiral inward** on a curved
  arc (tangential swirl that grows as they fall — the gravity-pulled trail), with **per-particle star
  tints** (light blue / orange / white via vertex colors). Core brightens with hold intensity.

Verified live (Atoms-era seed): idle shows the atom; holding shows the spiralling colored infall and
Energy climbing. tsc clean, no console errors. The `window.__uni` debug handle was removed after use.

---

## Milestone P2a — Ladder expansion (4 inserted tiers + v4→v5 migration)

Lengthened the COMPLEXITY ladder per PHASE2-DEEPENING §P2. Inserted four tiers so it no longer
jumps Atoms→Stars and so the high end has more steps:

```
Quantum foam → Particles → Atoms → [Molecules] → [Nebulae] → Stars → Galaxies
  → [Clusters] → Life → [Civilization] → ???
```

### Pieces
- `data/tiers.ts` — added the 4 `TierDef`s at their ladder slots; extended `TierVisualKey` with
  `molecules | nebulae | clusters | civilization`. **Re-tuned `negentropyWeight` across the WHOLE
  ladder** to a ~×3 geometric backbone with the two deliberate spikes preserved:
  `1, 8, 55, 150, 400, 1000, 3000, 9000, 65000, 200000, 1400000`. Strictly increasing & super-linear;
  the Life spike is clusters(9000)→life(65000) ≈ ×7.2 and the ??? spike is
  civilization(200000)→unknown(1.4M) ≈ ×7 — the inserts fill smoothly without flattening either
  payoff. `unlockCost`/`energyMult`/`scaleContribution` interpolate log-sensibly between neighbours.
- `data/generators.ts` — one source per new tier (`requiresTier` set): **Covalent forge** (molecules),
  **Nebular cradle** (nebulae), **Filamentary web** (clusters), **Noospheric array** (civilization).
- `data/facts.ts` — one `tier-reached` fact per new tier (cold/vast/eerie register): *First bonds*,
  *Cradle*, *The web tightens*, *Lights in the dark*.
- `data/survey.ts` — `surveyByEra` entries for the 4 new visualKeys; Civilization carries a lifesign
  line. Also re-pointed the existing **atoms** entry (it held "MOLECULAR CLOUD / chemistry viable",
  which now belongs to Molecules) to "NEUTRAL ATOMIC GAS / light runs free" so the two read distinctly.
- `data/comparisons.ts` — added intermediate Scale comparisons (5e2, 2e3, 1e16, 1e20) so flavor stays
  dense across the longer ladder; still strictly ascending by threshold.
- `render/universe.ts` — added parametric `ERAS` entries for the 4 visualKeys (distinct colored clouds:
  molecules teal-green, nebulae violet gas, clusters indigo filament, civilization golden lights).
  The `Record<TierVisualKey, EraVisual>` stays exhaustive (compiles only because all 11 keys present).
  No bespoke FORMS built here — those are a separate task.
- `state/schema.ts` — `SAVE_VERSION` 4 → 5.
- `state/migrations.ts` — added `migrations[4]` (v4→v5).

### Migration rule
Inserting mid-ladder means an old save can own a later tier while a newly-inserted earlier one is
absent. Rule: **auto-unlock each inserted tier whose FOLLOWING tier is already unlocked.** Pairs
`[inserted, following]` in ladder order: `[molecules,nebulae] [nebulae,stars] [clusters,life]
[civilization,unknown]`, processed **latest-first** so chained insertions resolve in one pass
(Molecules picks up Nebulae after Nebulae itself unlocks off Stars). Result keeps the owned set a
valid sequential prefix, so `nextUnlockableTier` always points forward, never at a tier behind an
already-owned one.

### Verified (live dev server, source modules imported via Vite)
- `npm run typecheck` clean.
- v4 save at **Stars** → v5 with **Molecules+Nebulae auto-unlocked, Stars retained**;
  `nextUnlockableTier` → **galaxies** (forward).
- v4 save at **???** → owns all four inserts; `nextUnlockableTier` → null (ladder complete).
- v4 save at **Galaxies** (Life not owned) → Clusters/Civilization correctly stay **locked**;
  `nextUnlockableTier` → **clusters**.
- `negentropyWeight` strictly increasing across all 11 tiers; `deriveNegentropy` monotonic.
- All four new tiers render in the COMPLEXITY ladder; no console errors.

### Notes / deviations
- Touched the existing **atoms** survey copy (see above) — minor, to avoid Atoms and Molecules
  describing the same chemistry. No other existing copy changed beyond the negentropy re-tune.
- Bespoke render FORMS (molecule clusters, volumetric nebula, filament lattice, civilization grid)
  deliberately NOT built — the 4 new eras render as distinct parametric clouds for now.
- Generator-upgrade (pip) system untouched, per task constraints.

---

## Milestone P2b — Bespoke era forms (molecules / nebulae / clusters / civilization)

**Status:** complete. All four forms verified live via save-injection. Type-checks clean, no
console errors, scene-graph integrity check passes (molecule child world position asserted
non-zero after `updateMatrixWorld`).

### Pieces (`render/universe.ts`)

Each form mirrors the atom pattern: a private `Group` (`this.molecule` / `.nebula` / `.cluster` /
`.civilization`) added to `this.group`, opacity lerped toward 1 only at its `TierVisualKey`,
fade-in eased by the same `k = 1 − exp(−dt·1.5)` factor. The diffuse cloud's dim/contract now
uses `Math.max(atomOpacity, moleculeOpacity, nebulaOpacity, clusterOpacity, civilizationOpacity)`
so only the active form suppresses it (no double-dim on era transitions).

- **Molecule** — 4 glow-sprite nodes (1 central "heavy atom" at scale 0.52; 3 bonded nodes at
  0.34) + 3 dotted bond lines between centre and each node (18/32/50 glow Points per bond by
  quality). The whole group rotates with a slow wobble (`rotation.y` + damped `rotation.x`
  driven by `moleculeAngle`). Color: teal (#9aefd0 nodes, #7fd6c0 bonds).

- **Nebula** — 8/11/14 haze sprites (from `makeHazeTexture()` — the existing wide soft-gradient
  texture) scattered on a fuzzy sphere (r 0.6–2.2). Each sprite has a random scale (0.8–2.2),
  random base opacity (0.3–0.7) and a random phase offset. In `applyNebula` each sprite drifts
  sinusoidally in `elapsed` at three different frequencies per axis — slow, cheap, no geometry
  writes needed. `reducedMotion` freezes all drift (sprites visible but stationary). Color:
  purple (#c79af0).

- **Cluster / Cosmic Web** — 5 strands of quadratic Bezier glow points (40/70/100 pts/strand by
  quality). Control points `p0, p1, p2` are sampled uniformly on a sphere of r 1–2.1; the Bezier
  gives smooth arcs that look like cosmic filaments crossing through the central cloud. No
  per-frame geometry write (positions are baked; `applyCluster` only sets opacity). Color:
  indigo-blue (#b0c0ff).

- **Civilization** — 4×4 / 5×5 / 6×6 glow-sprite grid by quality, spacing 0.55 local units.
  Hub nodes at even `(ix, iz)` intersections are larger (scale 0.24, warm white #fff5b0); field
  nodes are smaller (scale 0.13, gold #ffd060). Group tilted `rotation.x = 0.45` at build time
  so it reads as an overhead city-grid in 3D; `rotation.y` rotates slowly during `applyCivilization`.

- **`makeHazeTexture`** added to the import from `./textures.ts` (it was already exported there).
- **`vite.config.ts`** — port falls back to `process.env["PORT"]` so the preview tool can assign
  a free port when 5173 is taken by another session.

### Scene-graph guard

The constructor ends with an explicit integrity check: after `scene.add(this.group)` and
`updateMatrixWorld(true)`, it reads a molecule side-node's world position (local (1.3, 0.55, 0.2)
— non-origin) and logs a `console.warn` if `lengthSq < 0.0001`. This catches the class of bug
that bit P1 (orbital groups built but not parented, stuck at origin).

### Verified (browser, high quality, Vite dev server)

Each era loaded via save-injection + reload (autosave clobbering blocked by `localStorage.__proto__
.setItem` override in the eval call, per the testing caveat documented in M3):

- **Molecules** — 4 teal nodes with 3 dotted bonds clearly readable; slowly tumbling; diffuse
  cloud receded to ~12%.
- **Nebulae** — 14 purple haze blobs at varied sizes and opacities, overlapping to give volumetric
  depth; sprites extended beyond canvas edges; cloud fully suppressed.
- **Clusters** — 5 blue-white bezier strands sweeping across the canvas as large arcs, evoking
  a cosmic filament network; cloud suppressed.
- **Civilization** — 6×6 golden grid (larger warm-white hubs at even intersections, smaller gold
  field nodes) tilted as a top-down city view; slowly rotating.
- No console errors or warnings in any era. `npm run tsc --noEmit` clean.

### Notes / deviations
- Cluster strands are **randomized at construction** — each page load generates new filament paths.
  This is intentional (cosmic web is irregular), but it means automated screenshot baselines will
  drift. If determinism is needed later, seed the PRNG.
- Nebula sprites use `depthTest: false` (consistent with atom/molecule nodes) so haze layers all
  composite even when the camera is inside them.
- **Civilization grid is not a particle system** — it's discrete `Sprite` objects. At 6×6 = 36
  sprites this is cheap; if the grid grows in future (E6 polish), switch to a single `Points`
  geometry with positional instancing.

---

## Galaxy Rescope G1 — Galaxy reframe + ladder reconciliation

**Status:** complete. Pure naming/flavor — no save-schema change, no migration, no mechanic change.
`npm run typecheck` passes (only pre-existing vite.config.ts `process` error from P2b). Verified live
in browser: Consume button shows "CONSUME GALAXY", tier ladder shows "Galactic Disk" and "Globular
Clusters", no console errors.

### What changed

**Prestige-unit reframe (universe → galaxy) in all player-facing copy:**
- `ui/consumeButton.ts` — "◇ CONSUME UNIVERSE" → "◇ CONSUME GALAXY"
- `ui/hud.ts` — panel title "UNIVERSE SURVEY" → "GALAXY SURVEY"; aria-label "into the universe" → "into the galaxy"
- `ui/cycleLog.ts` — "Universes consumed:" → "Galaxies consumed:"; hint text "consume X universes" → "galaxies"
- `main.ts` — offline AFK popup "The universe yielded" → "The galaxy yielded"
- `data/disciplines.ts` — 4 player-facing strings: matter blurb, hunger blurb, Event Horizon description, Deep Survey description
- `data/facts.ts` — cycle facts ("new universe", "Ten universes fed") → galaxy framing; particles fact "The universe now has a temperature" → "The void now has a temperature"; scale fact "cross the universe" → "cross the galaxy"
- `README.md` — flavor blurb "grow a universe from a spark" → "grow a galaxy from a spark"

**Tier reconciliation (display name only; ids and visualKeys unchanged):**
- `data/tiers.ts` — "galaxies" tier: name "Galaxies" → "Galactic Disk"; "clusters" tier: name "Clusters" → "Globular Clusters"
- `data/facts.ts` — fact-galaxies: title "Structure" → "The disc", body rewritten to spiral disc forming; fact-clusters: title "The web tightens" → "Halo", body rewritten to globular clusters orbiting the halo (away from cosmic-web / inter-galactic framing)
- `data/survey.ts` — galaxies entry: "GALACTIC FILAMENT / structure self-organizing" → "SPIRAL DISC / stars coalescing into arms"; clusters entry: "COSMIC WEB / galaxies threaded along filaments" → "GLOBULAR CLUSTERS / ancient spheres orbiting the halo"

**Scale-comparison reframe (galaxy-consistent framing):**
- `data/comparisons.ts` — threshold 1: "Your universe is smaller than a thought" → "The seed of a galaxy — smaller than a thought"; threshold 10: "Your universe now spans a single atom" → "The nascent galaxy spans a single atom"; threshold 1e16: cosmic-web reference → "The galactic plane extends. The oldest stars orbit the halo in silence."; threshold 1e18: "A supercluster" → "The full extent dwarfs the disc. Most of the mass is invisible."

### Deviations / decisions
- No change to tier ids, visualKeys, save schema, or any mechanic/balance number — P2b render forms keep working without modification.
- "universe" in internal code comments (render/universe.ts, sim/prestige.ts etc.) left untouched — not player-facing.
- Cosmological uses of "universe" in facts that describe physical processes (e.g., "The void now has a temperature" replacing the particles fact) were reworded to neutral terms rather than "galaxy" since pre-galactic matter genuinely predates any galaxy.

---

## Galaxy Rescope G2 — Galaxy variety system (real morphologies + names + modifiers)

**Status:** complete. Adds a per-run target galaxy (morphology + real name + one small modifier) that
persists through Consume and advances each cycle. `npm run typecheck` passes for all `src/` (only the
pre-existing `vite.config.ts` `process.env` error remains, unrelated to G2). Verified live: migration,
advance rule, modifier multipliers, and the per-run reset all confirmed via served-module eval; the
Consume button and GALAXY SURVEY render the target galaxy.

### Data shape (`src/data/galaxies.ts`)
- `GalaxyMorphology`: spiral · barred-spiral · elliptical · lenticular · irregular · dwarf.
- `GalaxyArchetype` = `{ id, morphology, morphologyName, names[], blurb, modifier }`. `names` are pools
  of REAL galaxies (Andromeda/M31, Milky Way, M87, Sombrero/M104, LMC/SMC, Leo I, …). `blurb` is an
  eerie one-liner with a real-ish stat hook (diameter / star count).
- `GalaxyModifier` = `{ kind, magnitude, label }`. **One** small modifier per morphology, each mapping
  to existing multiplier plumbing — never punishing (Pillar):
  | morphology | kind | effect |
  |---|---|---|
  | dwarf | production | Energy/s ×1.22 |
  | irregular | scale | visible Scale ×1.15 |
  | spiral | production | Energy/s ×1.15 |
  | barred-spiral | channel | channel rate ×1.25 |
  | lenticular | offline | offline efficiency +0.30 (additive) |
  | elliptical | negentropy | ripeness ×1.12 |
- `GalaxyState` = `{ archetypeId, name }`. `starterGalaxy()` → a small **dwarf**; `nextGalaxy()` walks
  a curated escalating order (dwarf→irregular→spiral→barred-spiral→lenticular→elliptical, wrapping) and
  draws a fresh name (no immediate repeat within a pool).

### Save version
- `SAVE_VERSION` 5 → **6**. `migrations[5]` seeds `galaxy: starterGalaxy()` for any save lacking it
  (default = a small dwarf). Verified: a v5 save with no galaxy field migrates to v6 with the dwarf
  starter; cycle/other fields preserved.

### Sim wiring (all in `sim/galaxies.ts`, consumed by the rest of sim/ — stays acyclic)
- `galaxyProductionMultiplier` → `production.ts` `energyPerSecond`
- `galaxyScaleMultiplier` / `galaxyNegentropyMultiplier` → `derive.ts` `deriveScale` / `deriveNegentropy`
- `galaxyChannelMultiplier` → `actions.ts` `channelRate`
- `galaxyOfflineEfficiencyBonus` → `offline.ts` efficiency (additive, alongside the Time tree, still
  clamped by `MAX_OFFLINE_EFFICIENCY`)
- `currentArchetype()` is the pure getter.

### Persist / advance semantics
- `prestige.consume()` resets per-run state (energy, generators, tierLevels, upgrades) as before, then
  sets `state.galaxy = nextGalaxy(state.galaxy)`. The galaxy is **not** per-run state — it survives the
  reset and advances. Verified: Consume took dwarf(Leo I) → irregular(IC 10) while energy/generators/
  tierLevels reset and cycle incremented.

### UI
- `ui/consumeButton.ts` — "◇ CONSUME — {galaxy name}".
- `ui/surveyPanel.ts` — GALAXY SURVEY gains a header (name · morphology), an italic blurb, and the
  modifier label (`.survey-galaxy-name/-blurb/-boon` in `style.css`).
- `main.ts` — on Consume, a "NEW TARGET" popup surfaces the next galaxy + its boon.

### Advance rule
Curated escalating order (smallest → largest morphology), wrapping; name picked randomly from the new
archetype's pool with an immediate-repeat guard. Random name (not deterministic) for replay variety;
the morphology order is fixed and never immediately repeats.

### Deviations / decisions
- Modifiers are single-effect per morphology (one multiplier each) to keep them legible and the curve
  easy for the E6c balance pass to reason about. "irregular +variance" is modeled as a flat Scale
  bonus (deterministic) rather than literal per-tick randomness, to keep production AFK-predictable.
- The starter/migrated galaxy always carries the dwarf production modifier — there is no "no galaxy"
  baseline (every run has a target by design), so the P3a-style zero-upgrade continuity note does not
  apply here.

---

## Milestone P3a — Generator pip-upgrade system (data + sim + save)

**Status:** complete. Each generator SOURCE gains four per-run upgrade TRACKS bought with Energy and
reset on Consume. `npm run typecheck` passes for all `src/` (only the pre-existing `vite.config.ts`
`process.env` error remains). Verified live via served-module eval: each track moves exactly its target
dimension, zero-upgrade continuity holds, Consume clears the upgrades, and the v6→v7 migration defaults
to empty.

### Save version
- `SAVE_VERSION` 6 → **7**. NOTE: the SESSION-PROMPTS P3a text said "bump to v6 / migrations[5]" — that
  was written before Galaxy Rescope **G2**, which already took v6 and `migrations[5]`. So P3a went to
  **v7** with **migrations[6]** (default `generatorUpgrades: {}`). Always check live `SAVE_VERSION`.

### Data shapes
- `data/generators.ts` — added a **second source per tier** (11 → 22 sources): a costlier, beefier
  "rare" variant alongside each original (e.g. Vacuum fluctuation + Zero-point well). `GeneratorDef`
  fields unchanged, so the existing panel and all generator math absorb them with no edits.
- `data/generatorUpgrades.ts` (new balance table) — the four `UpgradeTrackDef`s and the `pipBand`
  curve constants:
  - Tracks: **Rate** (amplify production), **Efficiency** (reduce unit cost, ≤1), **Mass** (amplify
    Scale contribution), **Density** (amplify Negentropy contribution). Each carries
    `effectPerPip` + `effectBandBonus` and a `mode` ("amplify" → ×(1+mag); "reduce" → ×1/(1+mag)).
  - `pipBand`: 5 pips/band × 3 bands = **15 levels** (extensible via `maxBands`). Per-pip cost =
    `source.baseCost × baseCostFactor(4) × pipCostGrowth(1.35)^level × bandCostMultiplier(3)^completedBands`.
    `efficiencyFloor` 0.2 caps the cost reduction. `bandColors` teal→gold→mauve drive the P3b pip row.

### Pip-band curve (the math, in `sim/generatorUpgrades.ts`)
- magnitude(level) = `effectPerPip·level + effectBandBonus·floor(level/5)` — linear within a band with a
  larger jump at each completed band boundary.
- amplify multiplier = `1 + magnitude`; reduce (Efficiency) = `max(1/(1+magnitude), efficiencyFloor)`.
- At level 0 magnitude is 0 → multiplier exactly 1, so every derived value is **continuous** with its
  pre-P3a definition.

### Sim wiring (all multipliers from `sim/generatorUpgrades.ts`; it imports only data/+state/ → acyclic)
- **Rate** → `production.ts energyPerSecond`: each source's per-unit contribution ×`sourceRateMultiplier`.
- **Efficiency** → `actions.ts`: new `genCostFactor = genCostMultiplier × sourceEfficiencyMultiplier`
  used by both `effectiveGenCost` and `maxAffordableFor` (so affordability stays consistent).
- **Mass** → `derive.ts deriveScale`: tier progress is now a per-source weighted sum
  (`Σ count·sourceMassMultiplier`) via the new `weightedTierProgress` helper; collapses to the old
  `tierProgress` when no upgrades are owned.
- **Density** → `derive.ts deriveNegentropy`: same weighting with `sourceDensityMultiplier`, inside the
  existing `sqrt(1+progress)`.
- Buy intent: `actions.buyGeneratorUpgrade(state, sourceId, trackId)` — pip cost from
  `generatorUpgradeCost`, increments `state.generatorUpgrades[sourceId][trackId]`, caps at max level.
- `prestige.consume()` now also clears `state.generatorUpgrades = {}` (per-run, like `generators`).

### Exposed for the P3b UI
`generatorUpgradeLevel`, `generatorUpgradeCost`, `isTrackMaxed`, `pipBandState` (band/filledPips/color/
atMax), and the per-source multiplier getters — all pure reads; the UI never inlines balance numbers.

### Verified deltas (fresh state: 20× fluctuation, 10× quark-lattice)
Baseline eps 131.76 / Scale 131 / Negentropy 31.116 / next-cost 67.27. One pip each on `fluctuation`:
Rate → eps 132.93↑; Mass → Scale 134↑; Density → Negentropy 31.329↑; Efficiency → next-cost 62.29↓;
every non-targeted dimension unchanged. Consume cleared the upgrade. v6→v7 migrated to `{}`.

### Deviations / decisions
- Pip cost is **uniform across tracks** (keyed to the source's baseCost), not per-track — keeps the pip
  row legible and the E6c balance pass tractable. Effect magnitudes differ per track instead.
- Mass/Density attach by weighting per-source counts **inside** the existing tier formulas (rather than
  adding a separate additive term), which preserves exact continuity at zero upgrades.
- UI (the GENERATORS pip-row rebuild) is intentionally deferred to **P3b**; the current panel still
  renders all 22 sources unchanged in the meantime.

## Milestone P3b — Generator pip-row UI

**Status:** complete. `src/ui/generatorPanel.ts` rebuilt; CSS additions in `src/style.css`.
Browser-verified: pips fill teal → gold across a band boundary; buying a pip updates Energy and
the row live; disabled state respects affordability and MAX.

### What changed
- **`generatorPanel.ts`** — DOM structure extended: each `.gen-row` now appends a `.gen-tracks`
  container with four `.gen-track` rows (one per `upgradeTracks` entry). Each track row is a CSS
  grid of three columns: symbol+name label, 5 pip `<span>` dots, and a compact buy `<button>`.
  No track ids or colors are hardcoded — everything iterates `upgradeTracks` and reads from
  `pipBandState()`.
- **Subscriber update** — for each source/track: calls `pipBandState(level)` for band color and
  `filledPips`; toggles `.is-filled` + sets `style.background/borderColor/boxShadow` inline for the
  active band color; sets button text to formatted cost or "MAX", disabled when unaffordable or maxed.
- **`style.css`** — added `.gen-tracks`, `.gen-track` (3-col grid), `.gen-track-label`,
  `.gen-track-pips`, `.gen-pip` (7 px circle, border dims when empty), `.gen-track-buy` (compact,
  right-aligned, min-width 46 px). All sizing uses console CSS vars; tabular nums carry through.
- **Accessibility** — each pip buy button gets `aria-label="Buy <Track> pip for <Generator name>"`.

### Verified
- Bought 5 Rate pips on Vacuum fluctuation: first band all teal ●●●●●, cost escalated from ~40E to
  530E at the band boundary (3× `bandCostMultiplier`).

---

## Milestone E6a — Console boot sequence

**Status:** complete. Boot plays once on first load (staggered panel fade-in + type-on status),
then is skipped on every subsequent reload. Pure render/ui — no game logic, no schema change.

### Pieces
- `ui/console/boot.ts` — `shouldSkipBoot(settings)` checks the `console.boot.v1` localStorage key
  (hasSeen), `settings.reducedMotion`, `settings.quality === "low"`, and
  `prefers-reduced-motion` media query. `playBoot(visiblePanels, statusEl)` stagger-reveals panels
  and cycles three type-on status lines ("SUBSYSTEMS ONLINE" → "INSTRUMENTS LINKED" → "CONSOLE
  READY"). Panels are marked `.is-boot-pending` (opacity 0, translateY offset) then un-marked one
  by one (150ms stagger); each removal triggers the `panel-power-on` keyframe via an inline style
  animation. The status `cf-status` element is shown during the sequence and hidden after;
  `markSeen()` writes the localStorage flag when the final status line completes.
- `ui/console/frame.ts` — added a `cf-status` `<div>` inside `.console-frame`; changed return type
  from `HTMLElement` to `{ frame, statusEl }` so hud.ts can pass `statusEl` to the boot module.
- `ui/hud.ts` — destructures `{ frame, statusEl }` from `mountConsoleFrame`; after all panels are
  created and `gatePanel` subscribers have fired (synchronous, so hidden flags are settled), collects
  `visiblePanels = allPanels.filter(p => !p.hidden)` and calls `playBoot` iff `!shouldSkipBoot`.
- `style.css` — `.cf-status` (absolute, bottom-left above corner bracket, 10px monospace accent
  text); `.panel.is-boot-pending` (opacity 0, translateY 10px); `@keyframes panel-power-on`
  (0→1 opacity, 10px→0 translateY, 400ms ease-out).

### Skip conditions (any one skips the whole sequence)
1. `localStorage["console.boot.v1"] === "1"` — already seen.
2. `settings.reducedMotion === true` — user setting.
3. `settings.quality === "low"` — low-quality mode strips animations.
4. `window.matchMedia("(prefers-reduced-motion: reduce)").matches` — OS-level preference.

### Notes / deviations
- `seenBoot` persists in its own `console.boot.v1` key (not in `GameState`) to avoid a schema bump
  for a purely cosmetic flag — mirrors the `seenConsumeFX` approach per the task spec.
- `playBoot` uses an inline `panel.style.animation` (not a persistent CSS class) so the animation
  is genuinely transient: after `ANIM_MS + 80ms` the inline style is cleared and the panel returns
  to its normal (no-extra-rule) state.
- The `prefers-reduced-motion` media query is the CSS global skip (the `@media` block already
  freezes `cf-scan` and disables `survey-status` blink); the JS check in `shouldSkipBoot` prevents
  even `.is-boot-pending` from being applied, so no flash-of-invisible-panels on reduced-motion loads.
- Right-dock panels (READOUT, GENERATORS, DISCIPLINES) are created after the left-dock gate calls;
  boot collection runs after `root.append(...)` so all six panels exist in the DOM with correct
  hidden state before `visiblePanels` is filtered.
- Bought 1 pip crossing into band 1: `box-shadow` computed as `rgba(232,193,112,…)` = `#e8c170`
  (gold). Color advance confirmed via `preview_inspect`.
- Energy readout decremented live each purchase; button costs updated reactively.
- Higher-tier sources with unaffordable first pip show correctly disabled buttons.

### Decisions
- Pip row renders the **current band's 5 pips** only (via `filledPips` from `pipBandState`) — not a
  cumulative 15-dot strip. Keeps the row compact at dock width and mirrors the P3a intent: each band
  is a self-contained milestone. Band index is implied by the advancing pip color.
- Buy button shows the formatted Energy cost, not a "Buy pip" label — cost is the most actionable
  piece of info in a purchase decision at dock width.

---

## Milestone E6b — Console WebAudio cues

**Status:** complete. Extended the audio service with two new subtle synth cues wired to console UI interactions; sound is off by default (gated by existing `settings.sound`), type-checks clean.

### Changes
- **`src/services/audio.ts`** — added `"panel" | "node"` to the `Cue` union. Two new switch cases: `"panel"` (240 Hz triangle, 50ms, gain 0.03) for panel collapse/expand, `"node"` (480 Hz triangle, 60ms, gain 0.04) for discipline node purchase. Both follow the existing blip envelope (fast attack, exponential decay) scaled for subtlety (quieter gains than "tap").
- **`src/ui/console/panel.ts`** — imported audio service, added `audio.cue("panel")` in the title-button click handler when toggling collapse state.
- **`src/ui/disciplinePanel.ts`** — imported audio service, added `audio.cue("node")` in the discipline node buy button click handler.

### Notes
- Cues are gated by the existing `settings.sound` toggle (default off) via `audio.setEnabled` in `main.ts` — no new setting needed.
- The channel start already emits `audio.cue("tap")` in `src/ui/channel.ts` — left untouched per the spec.
- Frequencies and durations scale: "panel" (240 Hz, quiet) is subtler than "tap" (320 Hz); "node" (480 Hz, brief) sits between "tap" and "unlock" to signal a meaningful purchase without the fanfare of a milestone unlock.

---

## Build fix — vite.config.ts `process` typecheck (unblocks `npm run build`)

The P2b `process.env["PORT"]` line in `vite.config.ts` referenced Node's `process` global with no
`@types/node` installed, so `tsc` errored on it. Because `build` is `tsc && vite build`, this failed
the **whole optimized build** (the desktop launcher's `npm run build` step) — not just the standalone
typecheck. (NOTES had been carrying it as a harmless "pre-existing error"; it was not harmless for the
production build.) Fixed with a one-line type-only `declare const process: { env: Record<string,
string | undefined> }` at the top of `vite.config.ts` — erased at runtime (where Node's real `process`
exists), no new dependency, the PORT fallback still works. `npm run build` now completes (tsc clean +
`vite build` → dist). The only remaining build output is the benign Three.js >500 kB chunk-size warning.

## Milestone E6c — First balance pass (fully-noded production stack)

**Status:** complete. Two data-only tweaks in `src/data/disciplines.ts`; no `sim/` formula-shape
change, meta falloff + in-run sqrt DR intact, no timers/decay/failure. `npm run typecheck` clean for
all `src/` (only the pre-existing `vite.config.ts` `process.env` error remains). Not committed.

### The trace (what the fully-noded stack looked like)
`prestigeEnergyMultiplier = energyMult × globalMult × crossDiscipline`, a flat multiplier on **all**
Energy/sec from the first second of every run:
- **globalMult product = ×45** — four separate blunt `globalMult` capstones compounding:
  mass-without-end ×3 · the-long-devour ×1.5 · hollow-resonance ×2 · what-remains ×5. The formulas
  doc's intent is that `globalMult` be "the single blunt lever, kept rare" — four of them multiplying
  is the headline "absurdity."
- **crossDiscipline = ×3** at full noding (1 + 0.5·4 other capstones) — documented design value, left
  as-is (the breadth reward, and the reason Void is completed last).
- **energyMult = deepening-hunger ×1.5^L** — the only *unbounded* production node, and its cost growth
  (1.8) was shallow relative to its effect (1.5), so at high Entropy it ran away and dwarfed the
  capstone stack (effect ∝ Entropy^0.69).

Baseline apex stack = 45 × 3 = **×135** before deepening-hunger, then deepening-hunger multiplying
unbounded on top. Combined with the fully-laddered `tierMultiplier` (~6e13) this made the back half of
the tier ladder fall in seconds.

Reviewed and deliberately **not** touched: galaxy modifiers (×1.12–1.25, one per run — explicitly
small, never persistent); pip tracks (reset every Consume, self-limited by Energy cost keyed to source
baseCost); the tier `unlockCost` ramp and generator `costGrowth` (the ×100–1000 cross-tier cost jumps
already provide the walls, and steepening them would punish first-time players too, not just god saves);
crossDiscipline ×0.5 (design-locked breadth reward).

### Changes (highest-leverage, lowest-collateral; both inert until after the first Consume, so the
### early "reach first Consume" arc is provably unchanged — you can't buy any node with 0 Entropy)
1. **`void.what-remains` globalMult ×5 → ×3.** The apex blunt multiplier, sitting on top of everything
   else (you already own ×9 from the other three globals × ×3 cross when you unlock it). Cuts the
   globalMult product ×45 → **×27** (apex stack ×135 → **×81**, a ~40% trim). Still the second-largest
   single globalMult, so the literal last node of the tree still reads as a big, earned payoff; it also
   completes the fifth capstone and the cross-discipline scaling. Description string updated in lockstep
   (×5 → ×3).
2. **`matter.deepening-hunger` costGrowth 1.8 → 2.0.** Tightens the DR on the only unbounded energyMult
   node so late levels can't run away (effect now ∝ Entropy^0.585 via log1.5/log2, vs ^0.69 before).
   2.0 sits squarely in the doc's stated [1.7, 2.1] leveled-node regime (1.8 was at the low edge).
   Effect per level unchanged (×1.5), so early players still feel each level; only deep stacking is
   reined in. The first-Consume arc is unaffected (this node can't be bought until you have Entropy).

### Expected effect
Apex meta multiplier cut ~40% (×135 → ×81 before deepening-hunger) and the one unbounded lever's
late-game scaling pulled back, so a fully-noded save no longer blitzes the back half of the ladder as
hard — large-but-earned, not game-breaking. Prestige formula shape, meta falloff, in-run sqrt DR,
cost-reduction floors, and the offline cap are all untouched.

## Milestone E6d — Performance re-verify (Phase 2 + Galaxy Rescope)

**Status:** complete. No regressions found; no code changes made.

### Test conditions
Seeded late-game save: 8 tiers (Globular Clusters era, bespoke filament form active),
6 generators built (Vacuum fluctuation ×240, Zero-point well ×204, Quark lattice ×199,
Baryon loom ×189, Fusion crucible ×145, Stellar forge ×35), pip upgrades on Rate / Mass / Density
/ Efficiency tracks, disciplines purchased (Matter / Hunger / Time / Mind nodes),
12 cycles / 5M Entropy, GENERATORS panel open. Display: 165 Hz (Chrome, HW accel on).

### Frame-timing behaviour
The 60-FPS cap in `render/scene.ts` gates `composer.render()` to ≥ 16.67 ms gaps. At 165 Hz
(6 ms rAF ticks) this renders every 3rd tick ≈ **55.6 fps effective** — correct cap behaviour;
exact 60 fps on a 60 Hz display. WebGL command dispatch is async, so CPU time per frame
is unmeasurable via `performance.now()` (<0.5 ms observed including skip frames).

### Results per quality tier

| Config | Long tasks (>50 ms) | Console errors | Notes |
|---|---|---|---|
| **High** (idle) | none | none | clusters bespoke form + 3200 cloud pts |
| **High** + channel hold | none | none | 260 inflow particles active |
| **High** + reduced-motion | none | none | nebula drift/atom rotation suppressed |
| **Medium** (idle) | none | none | — |
| **Low** (steady-state) | none | none | — |
| **Low** (quality switch) | **77 ms** one-time | none | Three.js renderer teardown + shader recompile |

The 77 ms spike on quality switch is the `scene.stop()` + `initScene()` rebuild — a pre-existing
one-time cost dominated by WebGLRenderer disposal and shader compilation, not Phase 2 geometry.
After rebuild, Low quality runs clean.

### DOM subscriber (GENERATORS panel)
22 sources × 4 tracks × 5 pips = **440 pip elements** + 88 track-buy buttons + 66 gen-buy
buttons updated every store tick (100 ms cadence / 10 Hz). Read benchmark: **0.125 ms avg,
0.3 ms max** for the full element set. Writes estimated ≤ 0.5 ms. Total DOM load ≤ ~5 ms/s
— well within budget. No layout thrashing (all writes in one pass, no interleaved reads).

### Verdict
No regressions from Phase 2 bespoke era forms (molecule/nebula/cluster/civilization),
Galaxy Rescope G2, or the P3b pip-upgrade GENERATORS panel. No fixes made.
