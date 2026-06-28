// Central object — per-era visual states (VISUAL_SPEC §2).
// A particle cloud + glowing core that morphs through the Complexity ladder.
// Reads state only; never game logic.

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Points,
  PointsMaterial,
  type Scene,
  Sprite,
  SpriteMaterial,
} from "three";
import Decimal from "break_infinity.js";
import { tiers, type TierVisualKey } from "../data/tiers.ts";
import type { GameState } from "../state/schema.ts";
import { deriveScale } from "../sim/derive.ts";
import { makeGlowTexture } from "./textures.ts";

interface EraVisual {
  cloud: Color; // particle color
  core: Color; // central glow color
  radius: number; // cloud radius
  pointSize: number;
  spin: number; // rad/sec
  coreScale: number;
}

// Palette per VISUAL_SPEC §2/§6: near-black base, cold glows, one "wrong" accent.
const ERAS: Record<TierVisualKey, EraVisual> = {
  "quantum-foam": era("#b9a6ff", "#cdbcff", 0.6, 0.04, 0.05, 0.6),
  particles: era("#7fb0ff", "#bcd8ff", 0.9, 0.05, 0.35, 0.7),
  atoms: era("#ffb066", "#ffd9a8", 1.1, 0.05, 0.12, 0.8),
  stars: era("#bcd0ff", "#fff0c8", 1.4, 0.06, 0.08, 1.1),
  galaxies: era("#8a7ad8", "#c8b8ff", 1.9, 0.05, 0.14, 1.0),
  life: era("#66e6b8", "#a8ffe0", 1.7, 0.055, 0.06, 1.0),
  unknown: era("#c66ab0", "#ffb0e8", 1.8, 0.05, 0.04, 1.2),
};

function era(
  cloud: string,
  core: string,
  radius: number,
  pointSize: number,
  spin: number,
  coreScale: number,
): EraVisual {
  return {
    cloud: new Color(cloud),
    core: new Color(core),
    radius,
    pointSize,
    spin,
    coreScale,
  };
}

const PARTICLE_COUNTS = { low: 400, medium: 1200, high: 3200 } as const;

function currentEra(state: GameState): EraVisual {
  let key: TierVisualKey = "quantum-foam";
  for (const tier of tiers) {
    if ((state.tierLevels[tier.id] ?? 0) > 0) key = tier.visualKey;
  }
  return ERAS[key];
}

export class Universe {
  readonly group = new Group();
  private readonly points: Points;
  private readonly material: PointsMaterial;
  private readonly core: Sprite;
  private readonly coreMaterial: SpriteMaterial;
  private readonly baseRadii: Float32Array;
  private readonly cloudColor = new Color("#b9a6ff");
  private readonly coreColor = new Color("#cdbcff");
  private targetRadius = 0.6;
  private spin = 0.05;
  private coreScaleTarget = 0.6;

  constructor(scene: Scene, quality: GameState["settings"]["quality"]) {
    const count = PARTICLE_COUNTS[quality];
    const positions = new Float32Array(count * 3);
    this.baseRadii = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribute on a fuzzy sphere shell (uniform direction, jittered radius).
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const r = 0.55 + Math.random() * 0.45;
      const s = Math.sqrt(1 - u * u);
      positions[i * 3] = Math.cos(theta) * s * r;
      positions[i * 3 + 1] = u * r;
      positions[i * 3 + 2] = Math.sin(theta) * s * r;
      this.baseRadii[i] = r;
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));

    const glow = makeGlowTexture();
    this.material = new PointsMaterial({
      size: 0.05,
      map: glow,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      color: this.cloudColor.clone(),
    });
    this.points = new Points(geo, this.material);
    this.group.add(this.points);

    this.coreMaterial = new SpriteMaterial({
      map: glow,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      color: this.coreColor.clone(),
    });
    this.core = new Sprite(this.coreMaterial);
    this.core.scale.setScalar(0.6);
    this.group.add(this.core);

    scene.add(this.group);
  }

  update(state: GameState, dt: number, elapsed: number, reducedMotion: boolean): void {
    const target = currentEra(state);

    // Morph toward the current era's look.
    const k = 1 - Math.exp(-dt * 1.5);
    this.cloudColor.lerp(target.cloud, k);
    this.coreColor.lerp(target.core, k);
    this.material.color.copy(this.cloudColor);
    this.coreMaterial.color.copy(this.coreColor);
    this.targetRadius += (target.radius - this.targetRadius) * k;
    this.material.size += (target.pointSize - this.material.size) * k;
    this.coreScaleTarget += (target.coreScale - this.coreScaleTarget) * k;
    this.spin += (target.spin - this.spin) * k;

    // Scale (universe diameter) maps to a gentle, log-compressed group scale so
    // the universe visibly "fills" the frame as it grows without exploding.
    const scaleLog = Math.min(logOf(deriveScale(state)), 14);
    const fill = 1 + scaleLog * 0.05;
    this.group.scale.setScalar(this.targetRadius * fill * 0.6 + 0.4);

    // Motion: rotation + a soft "breathing" pulse on the core.
    if (!reducedMotion) {
      this.points.rotation.y += this.spin * dt;
      this.points.rotation.x += this.spin * 0.3 * dt;
    }
    const breathe = 1 + Math.sin(elapsed * 0.8) * 0.06;
    this.core.scale.setScalar(this.coreScaleTarget * breathe);
  }
}

function logOf(value: Decimal): number {
  if (value.lte(1)) return 0;
  return value.log10();
}
