// Parallax starfields + nebula haze (VISUAL_SPEC §5).
// 3 instanced Points layers drifting at different rates, plus a few large, very
// dim colored haze sprites for depth and the eerie cosmic mood.

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
import { makeGlowTexture, makeHazeTexture } from "./textures.ts";

interface Layer {
  points: Points;
  parallax: number; // how strongly it shifts with the pointer
  spin: number;
}

const LAYER_COUNTS = { low: [300, 150, 60], medium: [600, 300, 110], high: [1000, 500, 160] } as const;
const LAYER_SPECS = [
  { dist: 80, size: 0.5, parallax: 0.2, spin: 0.003, color: "#9fb4d8" }, // far
  { dist: 50, size: 0.7, parallax: 0.5, spin: 0.006, color: "#bcd0ff" }, // mid
  { dist: 30, size: 1.0, parallax: 1.0, spin: 0.01, color: "#dfeaff" }, // near
] as const;

export class Starfield {
  readonly group = new Group();
  private readonly layers: Layer[] = [];
  private readonly haze: Sprite[] = [];

  constructor(scene: Scene, quality: keyof typeof LAYER_COUNTS) {
    const counts = LAYER_COUNTS[quality];
    const glow = makeGlowTexture();

    LAYER_SPECS.forEach((spec, i) => {
      const count = counts[i] ?? 200;
      const positions = new Float32Array(count * 3);
      for (let j = 0; j < count; j++) {
        // Random points in a spherical shell at the layer's distance.
        const u = Math.random() * 2 - 1;
        const theta = Math.random() * Math.PI * 2;
        const r = spec.dist * (0.7 + Math.random() * 0.6);
        const s = Math.sqrt(1 - u * u);
        positions[j * 3] = Math.cos(theta) * s * r;
        positions[j * 3 + 1] = u * r;
        positions[j * 3 + 2] = Math.sin(theta) * s * r;
      }
      const geo = new BufferGeometry();
      geo.setAttribute("position", new BufferAttribute(positions, 3));
      const mat = new PointsMaterial({
        size: spec.size,
        map: glow,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        color: new Color(spec.color),
        opacity: 0.9,
        sizeAttenuation: true,
      });
      const points = new Points(geo, mat);
      this.group.add(points);
      this.layers.push({ points, parallax: spec.parallax, spin: spec.spin });
    });

    // Nebula haze: a few big, very dim colored clouds.
    const haze = makeHazeTexture();
    const hazeColors = ["#3a2d6b", "#1f4a55", "#2a2350"];
    for (let i = 0; i < 3; i++) {
      const mat = new SpriteMaterial({
        map: haze,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        color: new Color(hazeColors[i % hazeColors.length]),
        opacity: 0.25,
      });
      const sprite = new Sprite(mat);
      const angle = (i / 3) * Math.PI * 2;
      sprite.position.set(Math.cos(angle) * 18, Math.sin(angle) * 10, -25 - i * 6);
      sprite.scale.setScalar(40 + i * 12);
      this.group.add(sprite);
      this.haze.push(sprite);
    }

    scene.add(this.group);
  }

  update(dt: number, elapsed: number, pointerX: number, pointerY: number, reducedMotion: boolean): void {
    for (const layer of this.layers) {
      if (!reducedMotion) layer.points.rotation.y += layer.spin * dt;
      // Subtle parallax: shift each layer opposite the pointer.
      layer.points.position.x = -pointerX * layer.parallax * 1.5;
      layer.points.position.y = -pointerY * layer.parallax * 1.5;
    }
    if (!reducedMotion) {
      this.haze.forEach((s, i) => {
        s.material.rotation += dt * 0.02 * (i % 2 === 0 ? 1 : -1);
        s.material.opacity = 0.18 + Math.sin(elapsed * 0.2 + i) * 0.06;
      });
    }
  }
}
