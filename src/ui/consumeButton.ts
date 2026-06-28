// The Consume button (VISUAL_SPEC §7) — weighty, slightly ominous.
// Scaffold renders the button; the consume intent wires up in milestone 4.

import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";

export function mountConsumeButton(
  parent: HTMLElement,
  _store: Store<GameState>,
): void {
  const btn = document.createElement("button");
  btn.className = "consume-button";
  btn.textContent = "◇ CONSUME UNIVERSE";
  btn.disabled = true; // enabled once there's a universe worth consuming (M4)
  parent.append(btn);

  // Milestone 4: bind preview gain + emit consume intent on click.
}
