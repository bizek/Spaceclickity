// Console boot sequence (Expansion E6a, COMMAND_CONSOLE.md §Chrome layer).
// Staggered panel power-on + type-on chrome status. One-shot: persisted in
// localStorage key "console.boot.v1" (mirrors the seenConsumeFX pattern;
// intentionally outside GameState — purely cosmetic). Skipped under
// reducedMotion, prefers-reduced-motion, or quality=low.

const BOOT_KEY = "console.boot.v1";

function hasSeen(): boolean {
  try {
    return localStorage.getItem(BOOT_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(BOOT_KEY, "1");
  } catch {
    // Non-fatal.
  }
}

export function shouldSkipBoot(settings: {
  reducedMotion: boolean;
  quality: string;
}): boolean {
  if (hasSeen()) return true;
  if (settings.reducedMotion) return true;
  if (settings.quality === "low") return true;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  } catch {
    // matchMedia unavailable — proceed.
  }
  return false;
}

const STATUS_LINES = [
  "SUBSYSTEMS ONLINE",
  "INSTRUMENTS LINKED",
  "CONSOLE READY",
];

function typeOn(
  el: HTMLElement,
  text: string,
  charMs: number,
  onDone: () => void,
): void {
  el.textContent = "";
  let i = 0;
  const tick = (): void => {
    i++;
    el.textContent = text.slice(0, i);
    if (i < text.length) setTimeout(tick, charMs);
    else onDone();
  };
  setTimeout(tick, charMs);
}

/**
 * Stagger-reveal `visiblePanels` with a CSS animation and type-on status.
 * Caller must check shouldSkipBoot before calling. `visiblePanels` should be
 * already-filtered to only the panels that are actually shown on load.
 */
export function playBoot(
  visiblePanels: HTMLElement[],
  statusEl: HTMLElement,
): void {
  const PANEL_STAGGER = 150; // ms between successive panel reveals
  const INITIAL_DELAY = 60; // ms before the first panel starts
  const CHAR_MS = 22; // ms per character typed
  const HOLD_MS = 280; // ms to hold a completed status line before advancing
  const ANIM_MS = 400; // must match CSS panel-power-on duration

  // Park all panels at opacity 0 / offset before we stagger them in.
  for (const p of visiblePanels) {
    p.classList.add("is-boot-pending");
  }

  statusEl.hidden = false;

  // Stagger panels in using the keyframe animation.
  visiblePanels.forEach((panel, idx) => {
    setTimeout(() => {
      panel.classList.remove("is-boot-pending");
      // Inline animation so it doesn't conflict with any future transition.
      panel.style.animation = `panel-power-on ${ANIM_MS}ms ease-out both`;
      setTimeout(() => {
        panel.style.animation = "";
      }, ANIM_MS + 80);
    }, INITIAL_DELAY + idx * PANEL_STAGGER);
  });

  // Type-on status messages while panels appear.
  let lineIdx = 0;
  function nextLine(): void {
    if (lineIdx >= STATUS_LINES.length) return;
    const line = STATUS_LINES[lineIdx++] ?? "";
    typeOn(statusEl, line, CHAR_MS, () => {
      if (lineIdx < STATUS_LINES.length) {
        setTimeout(nextLine, HOLD_MS);
      } else {
        // Final line done — wait for the last panel animation then hide status.
        const lastPanelEnd =
          INITIAL_DELAY +
          Math.max(0, visiblePanels.length - 1) * PANEL_STAGGER +
          ANIM_MS;
        const now =
          INITIAL_DELAY +
          STATUS_LINES.slice(0, lineIdx - 1).reduce(
            (acc, l) => acc + l.length * CHAR_MS + HOLD_MS,
            0,
          ) +
          line.length * CHAR_MS;
        const hideDelay = Math.max(300, lastPanelEnd - now + 100);
        setTimeout(() => {
          statusEl.hidden = true;
          statusEl.textContent = "";
          markSeen();
        }, hideDelay);
      }
    });
  }
  nextLine();
}
