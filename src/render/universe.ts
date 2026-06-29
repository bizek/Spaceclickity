// Central object — per-era visual states (VISUAL_SPEC §2 + Expansion P1/P2b).
// A particle cloud + glowing core that morphs through the Complexity ladder,
// plus (P1) a hold-to-channel inflow (particles spiralling in from off-screen,
// star-coloured) and the first bespoke era "form": the atom (nucleus + dotted
// orbital rings with electrons). Reads state only; never game logic.
// P2b adds: molecule (linked nodes + bonds), nebula (haze sprites + drift),
// cluster/cosmic-web (filamentary strands), civilization (structured grid).

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
  Vector3,
} from "three";
import Decimal from "break_infinity.js";
import { tiers, type TierVisualKey } from "../data/tiers.ts";
import type { GameState } from "../state/schema.ts";
import { deriveScale } from "../sim/derive.ts";
import { makeGlowTexture, makeHazeTexture } from "./textures.ts";
import { channeling } from "./channeling.ts";

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
  molecules: era("#7fd6c0", "#bff0e0", 1.25, 0.05, 0.1, 0.85),
  nebulae: era("#c79af0", "#e6cfff", 1.55, 0.07, 0.04, 0.95),
  stars: era("#bcd0ff", "#fff0c8", 1.4, 0.06, 0.08, 1.1),
  galaxies: era("#8a7ad8", "#c8b8ff", 1.9, 0.05, 0.14, 1.0),
  clusters: era("#6a78d8", "#b0c0ff", 2.1, 0.045, 0.09, 1.0),
  life: era("#66e6b8", "#a8ffe0", 1.7, 0.055, 0.06, 1.0),
  civilization: era("#ffd27a", "#fff0c0", 1.8, 0.05, 0.05, 1.1),
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
const INFLOW_COUNTS = { low: 90, medium: 170, high: 260 } as const;

// Channel inflow: how far out particles spawn (× cloud radius) and how much they
// swirl as they fall in (radians) — the curved "pulled by gravity" trail.
const INFLOW_SPAWN = 2.7;
const INFLOW_SWIRL = 2.2;
// Star-ish tints for the infalling matter (light blue / orange / white).
const INFLOW_TINTS: ReadonlyArray<readonly [number, number, number]> = [
  [0.74, 0.85, 1.0],
  [1.0, 0.79, 0.55],
  [1.0, 0.97, 0.9],
];

function currentEraKey(state: GameState): TierVisualKey {
  let key: TierVisualKey = "quantum-foam";
  for (const tier of tiers) {
    if ((state.tierLevels[tier.id] ?? 0) > 0) key = tier.visualKey;
  }
  return key;
}

/** One orbital of the atom form: a tilted ring of dots with an electron riding it. */
interface Orbital {
  group: Group;
  ringMat: PointsMaterial;
  electron: Sprite;
  electronMat: SpriteMaterial;
  radius: number;
  angle: number;
  speed: number;
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

  // Channel inflow (spiralling, star-coloured).
  private readonly inflow: Points;
  private readonly inflowMaterial: PointsMaterial;
  private readonly inflowPos: Float32Array;
  private readonly inflowDir: Float32Array; // radial entry direction (unit)
  private readonly inflowTan: Float32Array; // tangent for the swirl (unit)
  private readonly inflowPhase: Float32Array; // 1 = off-screen, 0 = centre
  private inflowOpacity = 0;
  private readonly tmpA = new Vector3();
  private readonly tmpB = new Vector3();

  // Atom form (first bespoke era visual).
  private readonly atom = new Group();
  private readonly atomNucleus: Sprite;
  private readonly atomNucleusMat: SpriteMaterial;
  private readonly orbitals: Orbital[] = [];
  private atomOpacity = 0;

  // Molecule form: linked atom-like nodes joined by dotted bond lines.
  private readonly molecule = new Group();
  private moleculeOpacity = 0;
  private moleculeAngle = 0;
  private readonly moleculeNodeMats: SpriteMaterial[] = [];
  private readonly moleculeBondMats: PointsMaterial[] = [];

  // Nebula form: layered wispy haze sprites with slow sinusoidal drift.
  private readonly nebula = new Group();
  private nebulaOpacity = 0;
  private readonly nebulaMats: SpriteMaterial[] = [];
  private readonly nebulaSprites: Sprite[] = [];
  private readonly nebulaBase: Float32Array; // base positions (x,y,z per sprite)
  private readonly nebulaPhase: Float32Array; // random drift phase per sprite
  private readonly nebulaBaseOpacity: number[] = [];

  // Cluster / Cosmic Web form: filamentary lattice of points along bezier strands.
  private readonly cluster = new Group();
  private clusterOpacity = 0;
  private readonly clusterMats: PointsMaterial[] = [];

  // Civilization form: structured grid of small lights (ordered vs. organic forms).
  private readonly civilization = new Group();
  private civilizationOpacity = 0;
  private civilizationAngle = 0;
  private readonly civilizationMats: SpriteMaterial[] = [];

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

    // --- Channel inflow: star-coloured particles spiral in from off-screen. ---
    const inflowCount = INFLOW_COUNTS[quality];
    this.inflowPos = new Float32Array(inflowCount * 3);
    this.inflowDir = new Float32Array(inflowCount * 3);
    this.inflowTan = new Float32Array(inflowCount * 3);
    this.inflowPhase = new Float32Array(inflowCount);
    const inflowColors = new Float32Array(inflowCount * 3);
    for (let i = 0; i < inflowCount; i++) {
      this.spawnInflow(i, Math.random());
      const tint = INFLOW_TINTS[i % INFLOW_TINTS.length] ?? INFLOW_TINTS[0]!;
      inflowColors[i * 3] = tint[0];
      inflowColors[i * 3 + 1] = tint[1];
      inflowColors[i * 3 + 2] = tint[2];
    }
    const inflowGeo = new BufferGeometry();
    inflowGeo.setAttribute("position", new BufferAttribute(this.inflowPos, 3));
    inflowGeo.setAttribute("color", new BufferAttribute(inflowColors, 3));
    this.inflowMaterial = new PointsMaterial({
      size: 0.07,
      map: glow,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexColors: true,
      opacity: 0,
    });
    this.inflow = new Points(inflowGeo, this.inflowMaterial);
    this.inflow.visible = false;
    this.group.add(this.inflow);

    // --- Atom form: nucleus + dotted orbital rings (fades in at the Atoms era). ---
    this.atomNucleusMat = new SpriteMaterial({
      map: glow,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      color: new Color("#ffe0b0"),
      opacity: 0,
    });
    this.atomNucleus = new Sprite(this.atomNucleusMat);
    this.atomNucleus.scale.setScalar(0.6);
    this.atom.add(this.atomNucleus);

    const ringSpecs: ReadonlyArray<{ r: number; tilt: [number, number]; speed: number }> = [
      { r: 1.3, tilt: [1.2, 0.2], speed: 2.2 },
      { r: 1.75, tilt: [-0.5, 1.0], speed: -1.6 },
      { r: 2.15, tilt: [0.4, -0.9], speed: 1.2 },
    ];
    for (const spec of ringSpecs) {
      const orbital = this.makeOrbital(spec, glow);
      this.atom.add(orbital.group); // <-- add the orbital to the atom's graph
      this.orbitals.push(orbital);
    }
    this.atom.visible = false;
    this.group.add(this.atom);

    // --- Molecule form: 4 nodes + 3 bond lines (fades in at the Molecules era). ---
    // Nodes: one central "heavy" atom + three lighter bonded atoms; bonds are dotted
    // glow-point lines (not LineLoop — WebGL ignores line width).
    {
      const bondDots = quality === "low" ? 18 : quality === "medium" ? 32 : 50;
      const nodeSpecs: Array<{ p: [number, number, number]; s: number; c: string }> = [
        { p: [0, 0, 0],           s: 0.52, c: "#9aefd0" }, // central node (heavier)
        { p: [1.3, 0.55, 0.2],    s: 0.34, c: "#c8f8ec" },
        { p: [-1.3, 0.55, -0.2],  s: 0.34, c: "#c8f8ec" },
        { p: [0, -1.4, 0.1],      s: 0.34, c: "#c8f8ec" },
      ];
      for (const ns of nodeSpecs) {
        const mat = new SpriteMaterial({
          map: glow,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          blending: AdditiveBlending,
          color: new Color(ns.c),
          opacity: 0,
        });
        const spr = new Sprite(mat);
        spr.scale.setScalar(ns.s);
        spr.position.set(ns.p[0], ns.p[1], ns.p[2]);
        this.molecule.add(spr);
        this.moleculeNodeMats.push(mat);
      }
      const molBondColor = new Color("#7fd6c0");
      const bondPairs: Array<[[number, number, number], [number, number, number]]> = [
        [[0, 0, 0], [1.3, 0.55, 0.2]],
        [[0, 0, 0], [-1.3, 0.55, -0.2]],
        [[0, 0, 0], [0, -1.4, 0.1]],
      ];
      for (const [from, to] of bondPairs) {
        const pts = new Float32Array(bondDots * 3);
        for (let i = 0; i < bondDots; i++) {
          const t = i / (bondDots - 1);
          pts[i * 3]     = from[0] + (to[0] - from[0]) * t;
          pts[i * 3 + 1] = from[1] + (to[1] - from[1]) * t;
          pts[i * 3 + 2] = from[2] + (to[2] - from[2]) * t;
        }
        const bg = new BufferGeometry();
        bg.setAttribute("position", new BufferAttribute(pts, 3));
        const mat = new PointsMaterial({
          size: 0.055,
          map: glow,
          color: molBondColor,
          transparent: true,
          opacity: 0,
          blending: AdditiveBlending,
          depthWrite: false,
          depthTest: false,
        });
        this.molecule.add(new Points(bg, mat));
        this.moleculeBondMats.push(mat);
      }
      this.molecule.visible = false;
      this.group.add(this.molecule);
    }

    // --- Nebula form: overlapping haze sprites + slow sinusoidal drift. ---
    // Uses makeHazeTexture (wide soft gradient) for a volumetric-gas look.
    {
      const haze = makeHazeTexture();
      const spriteCount = quality === "low" ? 8 : quality === "medium" ? 11 : 14;
      this.nebulaBase = new Float32Array(spriteCount * 3);
      this.nebulaPhase = new Float32Array(spriteCount);

      for (let i = 0; i < spriteCount; i++) {
        // Scatter sprites uniformly on a fuzzy sphere (r ≈ 0.6–2.2).
        const u = Math.random() * 2 - 1;
        const theta = Math.random() * Math.PI * 2;
        const r = 0.6 + Math.random() * 1.6;
        const sinU = Math.sqrt(1 - u * u);
        const x = Math.cos(theta) * sinU * r;
        const y = u * r;
        const z = Math.sin(theta) * sinU * r;
        this.nebulaBase[i * 3]     = x;
        this.nebulaBase[i * 3 + 1] = y;
        this.nebulaBase[i * 3 + 2] = z;
        this.nebulaPhase[i] = Math.random() * Math.PI * 2;
        this.nebulaBaseOpacity.push(0.3 + Math.random() * 0.4);

        const mat = new SpriteMaterial({
          map: haze,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          blending: AdditiveBlending,
          color: new Color("#c79af0"),
          opacity: 0,
        });
        const spr = new Sprite(mat);
        spr.scale.setScalar(0.8 + Math.random() * 1.4);
        spr.position.set(x, y, z);
        this.nebulaSprites.push(spr);
        this.nebula.add(spr);
        this.nebulaMats.push(mat);
      }
      this.nebula.visible = false;
      this.group.add(this.nebula);
    }

    // --- Cluster / Cosmic Web form: glow points strung along bezier strands. ---
    // 5 strands of random quadratic bezier curves through a sphere of radius ~2.
    {
      const strandCount = 5;
      const ptsPerStrand = quality === "low" ? 40 : quality === "medium" ? 70 : 100;
      const clusterColor = new Color("#b0c0ff");

      for (let s = 0; s < strandCount; s++) {
        const randPt = (): [number, number, number] => {
          const u = Math.random() * 2 - 1;
          const th = Math.random() * Math.PI * 2;
          const r = 1.0 + Math.random() * 1.1;
          const si = Math.sqrt(1 - u * u);
          return [Math.cos(th) * si * r, u * r, Math.sin(th) * si * r];
        };
        const p0 = randPt(), p1 = randPt(), p2 = randPt();
        const pts = new Float32Array(ptsPerStrand * 3);
        for (let i = 0; i < ptsPerStrand; i++) {
          const t = i / (ptsPerStrand - 1);
          const mt = 1 - t;
          // Quadratic bezier: B(t) = mt²·p0 + 2·mt·t·p1 + t²·p2
          pts[i * 3]     = mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0];
          pts[i * 3 + 1] = mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1];
          pts[i * 3 + 2] = mt * mt * p0[2] + 2 * mt * t * p1[2] + t * t * p2[2];
        }
        const sg = new BufferGeometry();
        sg.setAttribute("position", new BufferAttribute(pts, 3));
        const mat = new PointsMaterial({
          size: 0.05,
          map: glow,
          color: clusterColor,
          transparent: true,
          opacity: 0,
          blending: AdditiveBlending,
          depthWrite: false,
          depthTest: false,
        });
        this.cluster.add(new Points(sg, mat));
        this.clusterMats.push(mat);
      }
      this.cluster.visible = false;
      this.group.add(this.cluster);
    }

    // --- Civilization form: tilted N×N grid of small lights (ordered geometry). ---
    // Hubs at even grid intersections are larger/brighter; field nodes are small.
    {
      const gridN = quality === "low" ? 4 : quality === "medium" ? 5 : 6;
      const spacing = 0.55;
      for (let ix = 0; ix < gridN; ix++) {
        for (let iz = 0; iz < gridN; iz++) {
          const x = (ix - (gridN - 1) / 2) * spacing;
          const z = (iz - (gridN - 1) / 2) * spacing;
          const isHub = ix % 2 === 0 && iz % 2 === 0;
          const mat = new SpriteMaterial({
            map: glow,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: AdditiveBlending,
            color: new Color(isHub ? "#fff5b0" : "#ffd060"),
            opacity: 0,
          });
          const spr = new Sprite(mat);
          spr.scale.setScalar(isHub ? 0.24 : 0.13);
          spr.position.set(x, 0, z);
          this.civilization.add(spr);
          this.civilizationMats.push(mat);
        }
      }
      this.civilization.rotation.x = 0.45; // tilt so the grid reads as 3D
      this.civilization.visible = false;
      this.group.add(this.civilization);
    }

    scene.add(this.group);

    // Scene-graph integrity: verify a non-origin molecule node has a non-zero world
    // position after parenting. The atom bug (groups built but not parented) was caught
    // this way — if this warn fires, check that every form's sub-group is .add()ed.
    this.group.updateMatrixWorld(true);
    const probe = this.molecule.children[1]; // node at (1.3, 0.55, 0.2) — non-origin
    if (probe !== undefined) {
      const wp = new Vector3();
      probe.getWorldPosition(wp);
      if (wp.lengthSq() < 0.0001) {
        console.warn(
          "[Universe] Scene-graph error: molecule child has zero world position; " +
            "verify all form sub-groups are added to their parent before scene.add().",
        );
      }
    }
  }

  /** Pick a fresh off-screen entry: a radial direction + a perpendicular tangent. */
  private spawnInflow(i: number, phase: number): void {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const dir = this.tmpA.set(Math.cos(theta) * s, u, Math.sin(theta) * s).normalize();
    // Tangent = dir × up (fall back to dir × x-axis when nearly parallel).
    const up = Math.abs(dir.y) > 0.95 ? this.tmpB.set(1, 0, 0) : this.tmpB.set(0, 1, 0);
    const tan = up.cross(dir).normalize();
    this.inflowDir[i * 3] = dir.x;
    this.inflowDir[i * 3 + 1] = dir.y;
    this.inflowDir[i * 3 + 2] = dir.z;
    this.inflowTan[i * 3] = tan.x;
    this.inflowTan[i * 3 + 1] = tan.y;
    this.inflowTan[i * 3 + 2] = tan.z;
    this.inflowPhase[i] = phase;
  }

  private makeOrbital(
    spec: { r: number; tilt: [number, number]; speed: number },
    glow: ReturnType<typeof makeGlowTexture>,
  ): Orbital {
    // The ring is a loop of glow dots (1px lines are invisible in WebGL).
    const dots = 70;
    const pts = new Float32Array(dots * 3);
    for (let i = 0; i < dots; i++) {
      const a = (i / dots) * Math.PI * 2;
      pts[i * 3] = Math.cos(a) * spec.r;
      pts[i * 3 + 1] = Math.sin(a) * spec.r;
      pts[i * 3 + 2] = 0;
    }
    const rg = new BufferGeometry();
    rg.setAttribute("position", new BufferAttribute(pts, 3));
    const ringMat = new PointsMaterial({
      size: 0.07,
      map: glow,
      color: new Color("#ffd09a"),
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const ring = new Points(rg, ringMat);

    const electronMat = new SpriteMaterial({
      map: glow,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      color: new Color("#d6ecff"),
      opacity: 0,
    });
    const electron = new Sprite(electronMat);
    electron.scale.setScalar(0.24);

    const group = new Group();
    group.rotation.x = spec.tilt[0];
    group.rotation.y = spec.tilt[1];
    group.add(ring, electron);

    return {
      group,
      ringMat,
      electron,
      electronMat,
      radius: spec.r,
      angle: Math.random() * Math.PI * 2,
      speed: spec.speed,
    };
  }

  update(state: GameState, dt: number, elapsed: number, reducedMotion: boolean): void {
    const key = currentEraKey(state);
    const target = ERAS[key];

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

    if (!reducedMotion) {
      this.points.rotation.y += this.spin * dt;
      this.points.rotation.x += this.spin * 0.3 * dt;
    }

    // Era form opacities — each targets 1 at its era, 0 otherwise.
    // The diffuse cloud recedes (dims + contracts) whenever any form is active,
    // so the form dominates rather than competing with the background cloud.
    const atomTarget = key === "atoms" ? 1 : 0;
    this.atomOpacity += (atomTarget - this.atomOpacity) * k;
    this.applyAtom(reducedMotion);

    const moleculeTarget = key === "molecules" ? 1 : 0;
    this.moleculeOpacity += (moleculeTarget - this.moleculeOpacity) * k;
    this.applyMolecule(dt, reducedMotion);

    const nebulaTarget = key === "nebulae" ? 1 : 0;
    this.nebulaOpacity += (nebulaTarget - this.nebulaOpacity) * k;
    this.applyNebula(elapsed, reducedMotion);

    const clusterTarget = key === "clusters" ? 1 : 0;
    this.clusterOpacity += (clusterTarget - this.clusterOpacity) * k;
    this.applyCluster();

    const civTarget = key === "civilization" ? 1 : 0;
    this.civilizationOpacity += (civTarget - this.civilizationOpacity) * k;
    this.applyCivilization(dt, reducedMotion);

    // Diffuse cloud contracts/dims uniformly when any form is faded in.
    const formOpacity = Math.max(
      this.atomOpacity,
      this.moleculeOpacity,
      this.nebulaOpacity,
      this.clusterOpacity,
      this.civilizationOpacity,
    );
    this.material.opacity = 1 - 0.88 * formOpacity;
    this.points.scale.setScalar(1 - 0.6 * formOpacity);

    // --- Channel: brighten/grow the core and pull the inflow in. ---
    const intensity = channeling.intensity;
    const breathe = 1 + Math.sin(elapsed * 0.8) * 0.06;
    this.core.scale.setScalar(this.coreScaleTarget * breathe * (1 + intensity * 0.7));
    this.applyInflow(dt, intensity, reducedMotion);
  }

  private applyAtom(reducedMotion: boolean): void {
    const visible = this.atomOpacity > 0.01;
    this.atom.visible = visible;
    if (!visible) return;

    this.atomNucleusMat.opacity = this.atomOpacity;
    const nucleusBreathe = 1 + Math.sin(performance.now() * 0.004) * 0.08;
    this.atomNucleus.scale.setScalar(0.55 * nucleusBreathe);

    const dt = reducedMotion ? 0 : 1 / 60;
    for (const o of this.orbitals) {
      o.ringMat.opacity = 0.85 * this.atomOpacity;
      o.electronMat.opacity = this.atomOpacity;
      o.angle += o.speed * dt;
      o.electron.position.set(Math.cos(o.angle) * o.radius, Math.sin(o.angle) * o.radius, 0);
    }
  }

  private applyMolecule(dt: number, reducedMotion: boolean): void {
    const visible = this.moleculeOpacity > 0.01;
    this.molecule.visible = visible;
    if (!visible) return;

    if (!reducedMotion) {
      this.moleculeAngle += 0.35 * dt;
      this.molecule.rotation.y = this.moleculeAngle;
      this.molecule.rotation.x = Math.sin(this.moleculeAngle * 0.4) * 0.3;
    }
    for (const m of this.moleculeNodeMats) m.opacity = this.moleculeOpacity;
    for (const m of this.moleculeBondMats) m.opacity = 0.7 * this.moleculeOpacity;
  }

  private applyNebula(elapsed: number, reducedMotion: boolean): void {
    const visible = this.nebulaOpacity > 0.01;
    this.nebula.visible = visible;
    if (!visible) return;

    for (let i = 0; i < this.nebulaSprites.length; i++) {
      this.nebulaMats[i]!.opacity = (this.nebulaBaseOpacity[i] ?? 0.5) * this.nebulaOpacity;
      if (!reducedMotion) {
        const ph = this.nebulaPhase[i] ?? 0;
        this.nebulaSprites[i]!.position.set(
          this.nebulaBase[i * 3]!     + Math.sin(elapsed * 0.12 + ph) * 0.25,
          this.nebulaBase[i * 3 + 1]! + Math.cos(elapsed * 0.09 + ph * 1.3) * 0.25,
          this.nebulaBase[i * 3 + 2]! + Math.sin(elapsed * 0.07 + ph * 0.7) * 0.18,
        );
      }
    }
  }

  private applyCluster(): void {
    const visible = this.clusterOpacity > 0.01;
    this.cluster.visible = visible;
    if (!visible) return;
    for (const m of this.clusterMats) m.opacity = 0.85 * this.clusterOpacity;
  }

  private applyCivilization(dt: number, reducedMotion: boolean): void {
    const visible = this.civilizationOpacity > 0.01;
    this.civilization.visible = visible;
    if (!visible) return;

    if (!reducedMotion) {
      this.civilizationAngle += 0.08 * dt;
      this.civilization.rotation.y = this.civilizationAngle;
    }
    for (const m of this.civilizationMats) m.opacity = this.civilizationOpacity;
  }

  private applyInflow(dt: number, intensity: number, reducedMotion: boolean): void {
    this.inflowOpacity += (intensity - this.inflowOpacity) * (1 - Math.exp(-dt * 6));
    const visible = this.inflowOpacity > 0.01;
    this.inflow.visible = visible;
    this.inflowMaterial.opacity = Math.min(1, this.inflowOpacity * 1.3);
    if (!visible) return;

    const maxR = this.targetRadius * INFLOW_SPAWN;
    const speed = (0.4 + intensity * 0.8) * (reducedMotion ? 0.5 : 1);
    for (let i = 0; i < this.inflowPhase.length; i++) {
      let phase = (this.inflowPhase[i] ?? 1) - dt * speed;
      if (phase <= 0.012) {
        this.spawnInflow(i, 1);
        phase = 1;
      } else {
        this.inflowPhase[i] = phase;
      }
      // Curved infall: swirl grows as the particle falls (radius ∝ phase^1.4),
      // rotating the entry point toward its tangent — a gravity-pulled arc.
      const swirl = INFLOW_SWIRL * (1 - phase);
      const cs = Math.cos(swirl);
      const sn = Math.sin(swirl);
      const rr = Math.pow(phase, 1.4) * maxR;
      const dx = this.inflowDir[i * 3] ?? 0;
      const dy = this.inflowDir[i * 3 + 1] ?? 0;
      const dz = this.inflowDir[i * 3 + 2] ?? 0;
      const tx = this.inflowTan[i * 3] ?? 0;
      const ty = this.inflowTan[i * 3 + 1] ?? 0;
      const tz = this.inflowTan[i * 3 + 2] ?? 0;
      this.inflowPos[i * 3]     = (dx * cs + tx * sn) * rr;
      this.inflowPos[i * 3 + 1] = (dy * cs + ty * sn) * rr;
      this.inflowPos[i * 3 + 2] = (dz * cs + tz * sn) * rr;
    }
    const attr = this.inflow.geometry.getAttribute("position") as BufferAttribute;
    attr.needsUpdate = true;
  }
}

function logOf(value: Decimal): number {
  if (value.lte(1)) return 0;
  return value.log10();
}
