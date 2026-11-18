/**
 * How big the hero helmet may be, and where it sits, for a given viewport.
 *
 * A fixed scale cannot work for both shapes of screen: the camera's 38° field
 * of view is vertical, so a phone in portrait sees roughly a quarter of the
 * world width a desktop does at the same distance. At the desktop scale the
 * helmet would be about three times wider than a phone viewport — the hero
 * would show a slab of shell rather than a helmet.
 *
 * Units are three.js world units at the camera target.
 */

/**
 * Worst-case width the helmet sweeps while it spins, in model units. The GLB's
 * bounding box is 1.89 wide and 2.00 deep (after the node's own +90° X
 * rotation), and a box that size presents (1.89 + 2.00) / √2 ≈ 2.75 to the
 * camera at 45°.
 */
export const SWEEP = 2.75;

/** Scale tuned for a wide desktop hero, where it crops a little top and bottom. */
export const DESKTOP_SCALE = 2.1;

/** How far the silhouette may bleed past the viewport edges and still read. */
const BLEED = 1.1;

/** Baseline lift, keeping the helmet off the contact shadow. */
const BASE_Y = 0.1;

/** Extra lift at full shrink, clearing the headline stacked below it. */
const LIFT = 1.1;

/**
 * Drop from the helmet centre to its contact shadow, in scale units. Chosen so
 * the desktop case lands on the plane the scene was tuned around, y = -1.7.
 */
const SHADOW_DROP = (BASE_Y + 1.7) / DESKTOP_SCALE;

/** Scale, vertical offset and shadow plane for a viewport `width` across. */
export function heroFit(width: number): {
  scale: number;
  y: number;
  shadowY: number;
} {
  const fit = Math.min(1, (width * BLEED) / (SWEEP * DESKTOP_SCALE));
  const scale = DESKTOP_SCALE * fit;
  const y = BASE_Y + (1 - fit) * LIFT;
  return { scale, y, shadowY: y - scale * SHADOW_DROP };
}
