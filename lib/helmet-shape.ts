/**
 * Proportions of the hero helmet, kept out of the component so they can be
 * checked by tests and tuned in one place. The shape is hand-built, so these
 * numbers are calibration, not derivation — expect to nudge them.
 *
 * Units are shell radii. The helmet faces +Z. Y runs from the crown (+1) down
 * to the neck roll (about -0.94).
 */

/** Side profile revolved around Y: [radius, height] from crown to neck. */
export const SHELL_PROFILE: [number, number][] = [
  [0, 1.0],
  [0.28, 0.985],
  [0.52, 0.93],
  [0.73, 0.83],
  [0.89, 0.67],
  [0.98, 0.45],
  [1.0, 0.18],
  [0.995, -0.1],
  [0.96, -0.38],
  [0.88, -0.6],
  [0.75, -0.76],
  [0.58, -0.86],
  [0.38, -0.91],
  [0.18, -0.93],
  [0, -0.94],
];

export const DIMS = {
  /** Front-to-back stretch applied to the shell and everything on it. */
  depth: 1.08,
  /** Dark surround of the face opening (theta measured from the crown). */
  eyeport: { radius: 1.004, phi: 2.24, thetaStart: 0.88, thetaLength: 0.64 },
  /** Smoked visor, sitting inside the surround. */
  visor: { radius: 1.014, phi: 2.02, thetaStart: 0.95, thetaLength: 0.5 },
  /** Chin bar: a sphere of radius 0.5 before scaling. */
  chin: {
    radius: 0.5,
    position: [0, -0.5, 0.72] as [number, number, number],
    scale: [1.02, 0.8, 1.0] as [number, number, number],
  },
  stripe: { radius: 1.008, halfWidth: 0.13 },
};

/**
 * Parts mounted on the shell, each placed on the surface by `surfaceZ`.
 * `y`/`x` choose the spot; `scale` flattens the 0.18-radius blank into a vent.
 */
export type Vent = {
  id: string;
  x: number;
  y: number;
  scale: [number, number, number];
  /** Mount on the back of the shell instead of the front. */
  back?: boolean;
};

export const VENT_BLANK_RADIUS = 0.18;

export const VENTS: Vent[] = [
  { id: "brow-left", x: -0.34, y: 0.6, scale: [1.25, 0.46, 0.78] },
  { id: "brow-right", x: 0.34, y: 0.6, scale: [1.25, 0.46, 0.78] },
  { id: "crown", x: 0, y: 0.95, scale: [1.7, 0.36, 1.0] },
  { id: "rear", x: 0, y: -0.14, scale: [1.7, 0.6, 0.6], back: true },
];

/** Visor pivot bosses, one per side, sitting where the visor hinges. */
export const PIVOT = { x: 0.97, y: 0.08, radius: 0.11, thickness: 0.07 };

/** Chin vent, centred on the chin bar's front face. */
export const CHIN_VENT = { y: -0.56, scale: [1.5, 0.42, 0.3] as [number, number, number] };

/** Position of a vent in the shell group's coordinates. */
export function ventPosition(vent: Vent): [number, number, number] {
  const z = surfaceZ(vent.y, vent.x);
  return [vent.x, vent.y, vent.back ? -z : z];
}

/** Position of a visor pivot boss. `side` is -1 (left) or 1 (right). */
export function pivotPosition(side: -1 | 1): [number, number, number] {
  return [side * PIVOT.x, PIVOT.y, surfaceZ(PIVOT.y, PIVOT.x)];
}

/** Z of the chin bar's surface at height `y`, on the centreline. */
export function chinSurfaceZ(y: number): number {
  const { radius, position, scale } = DIMS.chin;
  const dy = (y - position[1]) / (radius * scale[1]);
  const inside = 1 - dy * dy;
  return inside <= 0 ? position[2] : position[2] + radius * scale[2] * Math.sqrt(inside);
}

/** Shell radius at height `y`, linearly interpolated along the profile. */
export function shellRadiusAt(y: number): number {
  const points = SHELL_PROFILE;
  if (y >= points[0][1]) return points[0][0];
  const last = points[points.length - 1];
  if (y <= last[1]) return last[0];
  for (let i = 0; i < points.length - 1; i++) {
    const [r1, y1] = points[i];
    const [r2, y2] = points[i + 1];
    if (y <= y1 && y >= y2) {
      const t = (y1 - y) / (y1 - y2);
      return r1 + (r2 - r1) * t;
    }
  }
  return 0;
}

/** How far forward the shell reaches at height `y`. */
export function shellFrontZAt(y: number): number {
  return shellRadiusAt(y) * DIMS.depth;
}

/**
 * Z of the shell surface at height `y`, offset `x` from the centreline, in
 * pre-stretch coordinates — the space vents and pivots are positioned in, so
 * the group's `depth` scale applies to them too. Returns 0 when `x` is already
 * outside the shell at that height.
 *
 * Anything mounted on the shell must use this. Guessing a Z sinks the part
 * inside the shell, where it renders but cannot be seen.
 */
export function surfaceZ(y: number, x = 0): number {
  const r = shellRadiusAt(y);
  const inside = r * r - x * x;
  return inside <= 0 ? 0 : Math.sqrt(inside);
}

/** Vertical band a sphere segment covers, as [bottom, top] in Y. */
export function bandY(
  radius: number,
  thetaStart: number,
  thetaLength: number,
): [number, number] {
  return [
    radius * Math.cos(thetaStart + thetaLength),
    radius * Math.cos(thetaStart),
  ];
}

/** Chin bar bounds in Y and its forward reach, with `depth` applied. */
export function chinBounds(): { top: number; bottom: number; frontZ: number } {
  const { radius, position, scale } = DIMS.chin;
  const [, cy, cz] = position;
  const [, sy, sz] = scale;
  return {
    top: cy + radius * sy,
    bottom: cy - radius * sy,
    frontZ: (cz + radius * sz) * DIMS.depth,
  };
}
