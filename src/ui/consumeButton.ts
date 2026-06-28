// The Consume button (VISUAL_SPEC §7) — weighty, slightly ominous.
// Shows the Entropy a Consume would yield; emits the consume intent.

import { consume, previewEntropyGain } from "../sim/prestige.ts";
import type { Store } from "../state/store.ts";
import type { GameState } from "../state/schema.ts";
import { format } from "../util/format.ts";

export function mountConsumeButton(parent: HTMLElement, store: Store<GameState>): void {
  const btn = document.createElement("button");
  btn.className = "consume-button";
  parent.append(btn);

  const gainLine = document.createElement("div");
  gainLine.className = "consume-gain";
  parent.append(gainLine);

  btn.addEventListener("click", () => {
    store.update((s) => void consume(s));
  });

  store.subscribe((state) => {
    const gain = previewEntropyGain(state as GameState);
    const ripe = gain.gt(0);
    btn.disabled = !ripe;
    btn.textContent = "◇ CONSUME UNIVERSE";
    gainLine.textContent = ripe
      ? `+${format(gain, state.settings.notation)} Entropy`
      : "nothing ripe to consume";
  });
}
