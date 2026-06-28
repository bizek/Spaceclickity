# Space ClickerZ — Expansion Design Spine

*Re-entering the game-dev methodology at Phase 3 to plan a major expansion:
**passive trees, visual upgrades, and an EVE/X4-flavored command-console UI**.*

The base game (10 milestones) is feature-complete. This expansion is a **superset**
of it — it adds breadth without rewriting the validated sim/render/ui split or the
data-driven content model. Everything here is measured against the locked pillars in
[`01-pillars.md`](01-pillars.md).

---

## Locked direction (the human's calls)

These four decisions were made by the designer and frame everything downstream:

| Fork | Decision | Consequence |
|---|---|---|
| **Depth vs. pillar** | **Aesthetic & UI only.** Borrow EVE/X4's *look*, not its active-management depth. | The calm/AFK core loop is **unchanged**. No timers, decay, or failure states are added. |
| **Passive tree shape** | **Multiple themed trees** ("Disciplines"), each its own panel. | Five small directed graphs, not one giant web. Scales by adding data. |
| **Tree currency** | **Spend Entropy directly.** | One economy. The 3 existing prestige upgrades become root nodes of the trees. |
| **Sequencing** | **Design docs first.** | This doc set is the deliverable before any code. |

---

## Where the base game sits on the methodology

The expansion does **not** restart Phase 1. The base game already cleared every phase:

- **P1 Seed / P2 Loop / P3 Pillars** — locked in the 5 original spec docs.
- **P4 Systems / P5 Vocabulary** — tier ladder, generators, derived Scale/Negentropy, Consume→Entropy prestige, facts.
- **P6 Assets** — procedural (Three.js particles + bloom; no art files).
- **P7 Architecture / P8 Formulas** — decoupled sim/render/ui, data in `src/data/`, locked prestige curve.
- **P9 Prototype / P10 Build-out** — all 10 milestones shipped and browser-verified.

So the expansion **re-enters at Phase 3** (do the new features fit the pillars, or change them?) and proceeds broad→narrow.

---

## The expansion at a glance

Two new systems, both pillar-safe:

1. **Disciplines** (passive trees) — see [`02-systems.md`](02-systems.md) §A and the full node
   catalog in [`DISCIPLINES.md`](DISCIPLINES.md). Five themed trees of permanent,
   Entropy-bought nodes. They only grant multipliers/unlocks read by `sim/` — **no new verbs.**
2. **The Command Console** (expanded UI) — see [`02-systems.md`](02-systems.md) §B and the panel
   inventory in [`COMMAND_CONSOLE.md`](COMMAND_CONSOLE.md). A dense, multi-panel, holographic
   instrument framing the never-covered center. Pure render/ui — **no new game logic.**

The mechanical grammar that both lean on is in [`03-vocabulary.md`](03-vocabulary.md); the code
structures and the v4 save migration are in [`04-architecture.md`](04-architecture.md); the curves
and Entropy budgets are in [`05-formulas.md`](05-formulas.md).

---

## Build-out milestones (Phase 10)

Following the existing milestone discipline: **build → browser-verify → commit one at a time,
recording deviations in `NOTES.md`.** Ordered so the riskiest-to-the-pillar thing (the UI density)
gets validated on screen first, and so each milestone is independently shippable.

| # | Milestone | Adds | Why this order |
|---|---|---|---|
| **E1** | **Console shell** | New dock layout + reusable `Panel` framework + frame/scanline chrome; restyle the existing panels into it. *No new mechanics.* | Validates the EVE/X4 *feel* on screen fast and proves it doesn't cover the center or regress perf. This is the de-risking slice. |
| **E2** | **Telemetry & Survey panels** | Sparkline graphs of Energy/s, Scale, Negentropy; a faux-scan "universe survey" readout. Data-only. | Pure readout panels; the densest part of the EVE look, no game-logic risk. |
| **E3** | **Discipline framework + Matter & Hunger trees** | `data/disciplines.ts`, state **v4 + migration**, effect aggregator, tree renderer; migrate the 3 prestige upgrades into root nodes. | Smallest end-to-end vertical slice of the tree system; reuses the prestige aggregation pattern. |
| **E4** | **Time, Mind & Void trees + capstones** | Remaining three disciplines, capstone gating, cross-discipline scaling. | Content fill once the framework is proven. |
| **E5** | **Automation / unlock nodes** | Auto-buy cheapest generator, panel-unlock nodes, comparison reveal. | The QoL the AFK pillar specifically wants; depends on the tree + panel frameworks. |
| **E6** | **Polish** | Console boot sequence, console sound cues, balance pass, perf re-verify across quality tiers. | Final juice + the balance/perf guard. |

> **Methodology note:** the designer chose "design docs first," so E1 is *planned* here but not
> yet built. When we move to code, E1 doubles as the Phase-9-style prototype — the fastest way to
> learn whether the dense console actually feels right is to put it on screen.

---

## Open questions (to resolve during build, not now)

- Should panels be **draggable/dockable** (true EVE) or **fixed-but-collapsible** (simpler, still dense)? Default: fixed-but-collapsible for E1, revisit.
- Do the leveled "infinite" nodes risk trivializing the meta falloff? Tracked in [`05-formulas.md`](05-formulas.md) §Balance guard.
- Does the denser DOM cost measurable FPS alongside the WebGL scene? Verified in E6; budget noted in [`COMMAND_CONSOLE.md`](COMMAND_CONSOLE.md).
- Final discipline count: five proposed (Matter / Hunger / Time / Mind / Void). Could ship E3–E4 with fewer and add more as data later.
