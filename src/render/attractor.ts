// The Attractor meta-visual (VISUAL_SPEC §3).
// A vast dark mass at the edge of perception — implied negative space, not
// center-stage. It grows between cycles: each new universe looks smaller against
// it. A faint lensed rim (additive) traces its event horizon.

import {
  AdditiveBlending,
  Color,
  Group,
  NormalBlending,
  type Scene,
  Sprite,
  SpriteMaterial,
} from "three";
import type { GameState } from "../state/schema.ts";
import { makeHazeTexture, makeVoidTexture } from "./textures.ts";

export class Attractor {
  readonly group = new Group();
  private readonly voidSprite: Sprite;
  private readonly rim: Sprite;
  private size = 6;

  constructor(scene: Scene) {
    const voidMat = new SpriteMaterial({
      map: makeVoidTexture(),
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
      opacity: 0.95,
    });
    this.voidSprite = new Sprite(voidMat);

    const rimMat = new SpriteMaterial({
      map: makeHazeTexture(),
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      color: new Color("#241830"),
      opacity: 0.4,
    });
    this.rim = new Sprite(rimMat);

    // Sit at the lower-left edge, behind the universe.
    this.group.position.set(-9, -6, -6);
    this.group.add(this.rim, this.voidSprite);
    scene.add(this.group);
  }

  /** Target presence grows with how much the Attractor has consumed (Entropy + cycles). */
  private targetSize(state: GameState): number {
    const e = state.entropy.lte(1) ? 0 : Math.min(state.entropy.log10(), 30);
    return 5 + e * 0.7 + Math.log10(state.cycle + 1) * 1.5;
  }

  update(state: GameState, dt: number): void {
    const target = this.targetSize(state);
    this.size += (target - this.size) * (1 - Math.exp(-dt * 0.8));
    this.voidSprite.scale.setScalar(this.size);
    this.rim.scale.setScalar(this.size * 1.35);
  }

  /** Used by the Consume FX (M6) to punch the presence larger instantly. */
  bump(): void {
    this.size *= 1.08;
  }
}
