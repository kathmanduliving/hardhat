import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { DESKTOP_SCALE, SWEEP, heroFit } from "./hero-fit.ts";

/**
 * The viewport widths below are what the hero camera actually sees: a 38°
 * vertical field of view at distance 5 shows 3.44 world units of height, so
 * world width is 3.44 × the element's aspect ratio.
 */
const VISIBLE_HEIGHT = 2 * 5 * Math.tan((38 / 2) * (Math.PI / 180));
const widthFor = (px: number, py: number) => VISIBLE_HEIGHT * (px / py);

const DESKTOP = widthFor(1920, 900);
const PHONE = widthFor(390, 700);

/** Half the helmet's height after the GLB node's own +90° X rotation. */
const HALF_HEIGHT = 0.901;

test("a desktop hero keeps the tuned scale, position and shadow plane", () => {
  const { scale, y, shadowY } = heroFit(DESKTOP);
  assert.equal(scale, DESKTOP_SCALE);
  assert.equal(y, 0.1);
  assert.ok(Math.abs(shadowY + 1.7) < 1e-9, `shadow moved to ${shadowY}`);
});


test("the shadow plane tracks the helmet at every size", () => {
  for (const width of [PHONE, widthFor(768, 700), DESKTOP]) {
    const { y, scale, shadowY } = heroFit(width);
    const bottom = y - scale * HALF_HEIGHT;
    // The desktop tuning lets the shell dip just through the plane, which is
    // what makes the shadow read as contact rather than as a floating blob.
    assert.ok(
      shadowY < bottom + 0.1 * scale,
      `shadow ${shadowY.toFixed(2)} floats above the helmet bottom ${bottom.toFixed(2)}`
    );
    assert.ok(
      shadowY > bottom - 0.5 * scale,
      `shadow ${shadowY.toFixed(2)} is too far under ${bottom.toFixed(2)} to contact`
    );
  }
});

test("a phone shrinks the helmet to near the viewport width", () => {
  const { scale } = heroFit(PHONE);
  const swept = scale * SWEEP;
  assert.ok(
    swept < PHONE * 1.15,
    `helmet sweeps ${swept.toFixed(2)} across a ${PHONE.toFixed(2)} viewport: clipped`,
  );
  // Independent of the fit formula: whatever it does, the helmet still has
  // to be the subject of the hero rather than a speck in it.
  const tall = scale * 2 * HALF_HEIGHT;
  assert.ok(
    tall > VISIBLE_HEIGHT * 0.3,
    `helmet is ${tall.toFixed(2)} tall in a ${VISIBLE_HEIGHT.toFixed(2)} frame: too small to be the hero`,
  );
});

test("SWEEP and HALF_HEIGHT still describe the shipped model", () => {
  // Hand-derived constants go stale silently when the GLB is swapped, so they
  // are measured back off the asset here. Only the header and JSON chunk are
  // parsed — no glTF loader, no three.js.
  const glb = readFileSync("public/models/helmet.glb");
  const jsonLength = glb.readUInt32LE(12);
  const gltf = JSON.parse(glb.subarray(20, 20 + jsonLength).toString("utf8"));

  assert.equal(gltf.nodes.length, 1, "the model is no longer a single node");
  const rotation = gltf.nodes[0].rotation.map((v: number) => Math.round(v * 1e3) / 1e3);
  assert.deepEqual(
    rotation,
    [0.707, 0, 0, 0.707],
    `the model's own rotation changed to ${rotation}: re-derive the constants`,
  );

  const used = new Set<number>();
  for (const mesh of gltf.meshes) {
    for (const primitive of mesh.primitives) used.add(primitive.attributes.POSITION);
  }
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const index of used) {
    const { min, max } = gltf.accessors[index];
    for (let axis = 0; axis < 3; axis++) {
      lo[axis] = Math.min(lo[axis], min[axis]);
      hi[axis] = Math.max(hi[axis], max[axis]);
    }
  }

  // That +90° X rotation maps (x, y, z) to (x, -z, y), so the model's own Y
  // extent becomes its depth and its Z extent becomes its height.
  const width = hi[0] - lo[0];
  const depth = hi[1] - lo[1];
  const halfHeight = Math.max(Math.abs(lo[2]), Math.abs(hi[2]));

  // A width × depth box presents (width + depth) / √2 to the camera at 45°.
  const sweep = (width + depth) / Math.SQRT2;
  assert.ok(
    Math.abs(sweep - SWEEP) < 0.02,
    `the model sweeps ${sweep.toFixed(3)}, but SWEEP is ${SWEEP}`,
  );
  assert.ok(
    Math.abs(halfHeight - HALF_HEIGHT) < 0.02,
    `the model is ${halfHeight.toFixed(3)} half-high, but HALF_HEIGHT is ${HALF_HEIGHT}`,
  );
});

test("the helmet rises as the viewport narrows, to clear the headline", () => {
  assert.ok(heroFit(PHONE).y > heroFit(DESKTOP).y + 0.5);
  const widths = [PHONE, widthFor(768, 700), widthFor(1280, 800), DESKTOP];
  for (let i = 1; i < widths.length; i++) {
    assert.ok(heroFit(widths[i]).y <= heroFit(widths[i - 1]).y, `y is not monotonic at ${widths[i].toFixed(2)}`);
    assert.ok(heroFit(widths[i]).scale >= heroFit(widths[i - 1]).scale, `scale is not monotonic at ${widths[i].toFixed(2)}`);
  }
});

test("scale never exceeds the desktop tuning, however wide the screen", () => {
  assert.equal(heroFit(1000).scale, DESKTOP_SCALE);
  assert.equal(heroFit(DESKTOP * 3).scale, DESKTOP_SCALE);
});

test("a degenerate viewport does not produce a negative or zero scale", () => {
  assert.ok(heroFit(0.0001).scale > 0);
  assert.ok(Number.isFinite(heroFit(0).y));
});
