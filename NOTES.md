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
