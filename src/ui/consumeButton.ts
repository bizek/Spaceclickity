// The Consume button (VISUAL_SPEC §7) — weighty, slightly ominous.
// Shows the Entropy a Consume would yield; emits the consume intent.

import { previewEntropyGain } from "../sim/prestige.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";
import { format } from "../util/format.ts";

export function mountConsumeButton(
  parent: HTMLElement,
  store: Store<GameState>,
  onConsume: () => void,
): void {
  const btn = document.createElement("button");
  btn.className = "consume-button";
  parent.append(btn);

  const gainLine = document.createElement("div");
  gainLine.className = "consume-gain";
  parent.append(gainLine);

  // Emit the consume intent; main.ts plays the FX and applies the prestige.
  btn.addEventListener("click", () => onConsume());

  store.subscribe((state) => {
    const gain = previewEntropyGain(state as GameState);
    const ripe = gain.gt(0);
    btn.disabled = !ripe;
    btn.textContent = `◇ CONSUME — ${state.galaxy.name}`;
    gainLine.textContent = ripe
      ? `+${format(gain, state.settings.notation)} Entropy`
      : "nothing ripe to consume";
  });
}
