// Console chrome layer (Expansion E1, COMMAND_CONSOLE.md §Chrome layer).
// Sits above the canvas, below the HUD panels, never interactive. Pure CSS/SVG:
// corner brackets, a faint schematic grid, and animated scanlines. Honors the
// quality + reduced-motion settings (P4 anti-goal: must simplify, not regress).

import type { Store } from "../../state/store.ts";
import type { GameState } from "../../state/schema.ts";

/** Build the chrome layer and bind its intensity to settings. Returns the root. */
export function mountConsoleFrame(store: Store<GameState>): HTMLElement {
  const frame = document.createElement("div");
  frame.className = "console-frame";
  frame.setAttribute("aria-hidden", "true");

  const grid = document.createElement("div");
  grid.className = "cf-grid";

  const scan = document.createElement("div");
  scan.className = "cf-scan";

  frame.append(grid, scan);
  for (const corner of ["tl", "tr", "bl", "br"]) {
    const c = document.createElement("div");
    c.className = `cf-corner cf-${corner}`;
    frame.append(c);
  }

  // Intensity classes: Low quality drops the scanlines entirely; reduced-motion
  // freezes the scan animation. CSS does the rest.
  let prevQuality = "";
  let prevReduced: boolean | null = null;
  store.subscribe((state) => {
    if (state.settings.quality !== prevQuality) {
      prevQuality = state.settings.quality;
      frame.classList.toggle("is-low", prevQuality === "low");
    }
    if (state.settings.reducedMotion !== prevReduced) {
      prevReduced = state.settings.reducedMotion;
      frame.classList.toggle("is-reduced", prevReduced);
    }
  });

  return frame;
}
