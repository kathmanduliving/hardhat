import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CHIN_VENT,
  DIMS,
  PIVOT,
  SHELL_PROFILE,
  VENTS,
  VENT_BLANK_RADIUS,
  bandY,
  chinBounds,
  chinSurfaceZ,
  pivotPosition,
  shellFrontZAt,
  shellRadiusAt,
  surfaceZ,
  ventPosition,
} from "./helmet-shape.ts";

/**
 * The helmet is hand-tuned geometry nobody can see from a test, so these
 * assertions pin the proportions that make it read as a full-face helmet
 * rather than an egg: a protruding chin bar, a visor inside its surround at
 * eye height, and a closed shell.
 */

test("the shell profile is closed at both ends and never negative", () => {
  assert.equal(SHELL_PROFILE[0][0], 0, "crown must sit on the axis");
  assert.equal(
    SHELL_PROFILE[SHELL_PROFILE.length - 1][0],
    0,
    "base must close back onto the axis, or the shell shows a hole",
  );
  for (const [r, y] of SHELL_PROFILE) {
    assert.ok(r >= 0, `radius ${r} at y=${y} is negative`);
    assert.ok(r <= 1.0001, `radius ${r} at y=${y} exceeds one shell radius`);
  }
});

test("the profile descends monotonically from crown to base", () => {
  for (let i = 1; i < SHELL_PROFILE.length; i++) {
    assert.ok(
      SHELL_PROFILE[i][1] < SHELL_PROFILE[i - 1][1],
      `profile point ${i} does not descend`,
    );
  }
});

test("the shell is widest around eye height", () => {
  assert.ok(shellRadiusAt(0.18) > 0.99);
  assert.ok(shellRadiusAt(0.93) < 0.6, "crown must taper");
  assert.ok(shellRadiusAt(-0.9) < 0.5, "base must tuck in for the neck roll");
});

test("the chin bar protrudes in front of the shell", () => {
  const chin = chinBounds();
  const shellAtChin = shellFrontZAt((chin.top + chin.bottom) / 2);
  assert.ok(
    chin.frontZ > shellAtChin + 0.15,
    `chin reaches ${chin.frontZ.toFixed(3)} but the shell already reaches ${shellAtChin.toFixed(3)}: no chin bar is visible`,
  );
});

test("the chin bar overlaps the shell instead of floating free", () => {
  const chin = chinBounds();
  assert.ok(chin.top > -0.2, "chin bar sits too low to meet the eyeport");
  assert.ok(
    chin.bottom > SHELL_PROFILE[SHELL_PROFILE.length - 1][1] - 0.05,
    "chin bar hangs below the shell base",
  );
});

test("the visor sits inside its surround, at eye height", () => {
  const port = bandY(
    DIMS.eyeport.radius,
    DIMS.eyeport.thetaStart,
    DIMS.eyeport.thetaLength,
  );
  const visor = bandY(
    DIMS.visor.radius,
    DIMS.visor.thetaStart,
    DIMS.visor.thetaLength,
  );
  assert.ok(visor[0] > port[0], "visor reaches below the surround");
  assert.ok(visor[1] < port[1], "visor reaches above the surround");
  assert.ok(DIMS.visor.phi < DIMS.eyeport.phi, "visor is wider than the surround");
  assert.ok(
    DIMS.visor.radius > DIMS.eyeport.radius,
    "visor must sit on top of the surround, not inside the shell",
  );
  assert.ok(
    visor[0] > 0 && visor[1] < 0.75,
    `visor band ${visor.map((v) => v.toFixed(2)).join("..")} is not at eye height`,
  );
});

test("the chin bar and the eyeport leave a chin-bar face between them", () => {
  const visor = bandY(
    DIMS.visor.radius,
    DIMS.visor.thetaStart,
    DIMS.visor.thetaLength,
  );
  const gap = visor[0] - chinBounds().top;
  assert.ok(gap > 0.05, "visor meets the chin bar: no chin bar to see");
  assert.ok(gap < 0.5, "too much bare shell between visor and chin bar");
});

test("every vent sits on the shell surface, not buried inside it", () => {
  for (const vent of VENTS) {
    const [x, y, z] = ventPosition(vent);
    const surface = surfaceZ(y, x);
    assert.ok(surface > 0.1, `${vent.id} is placed where there is no shell`);
    assert.equal(
      Math.abs(z),
      surface,
      `${vent.id} is off the surface by ${(surface - Math.abs(z)).toFixed(3)}`,
    );
    // A flattened blank centred on the surface must still break through it.
    const halfDepth = VENT_BLANK_RADIUS * vent.scale[2];
    assert.ok(halfDepth > 0.02, `${vent.id} is too flat to be visible`);
    assert.equal(
      Math.sign(z),
      vent.back ? -1 : 1,
      `${vent.id} is mounted on the wrong side`,
    );
  }
});

test("the chin vent sits on the chin bar's face", () => {
  const z = chinSurfaceZ(CHIN_VENT.y);
  const chin = chinBounds();
  assert.ok(
    CHIN_VENT.y > chin.bottom && CHIN_VENT.y < chin.top,
    "chin vent is not on the chin bar at all",
  );
  // chinSurfaceZ is pre-stretch; chin.frontZ is the stretched maximum.
  assert.ok(z * DIMS.depth <= chin.frontZ + 1e-9);
  assert.ok(z * DIMS.depth > shellFrontZAt(CHIN_VENT.y), "chin vent is inside the shell");
});

test("the visor pivots sit on the shell near the equator", () => {
  const [x, y, z] = pivotPosition(1);
  assert.equal(x, PIVOT.x);
  assert.equal(z, surfaceZ(y, PIVOT.x));
  assert.ok(z > 0.15, "pivot is pushed so far out that it leaves the shell");
  assert.ok(Math.abs(y) < 0.3, "pivots belong near eye height, not the crown");
  assert.deepEqual(pivotPosition(-1), [-PIVOT.x, y, z]);
});

test("everything mounted on the shell is stretched with it", () => {
  assert.ok(DIMS.depth > 1, "helmets are longer front-to-back than side-to-side");
  assert.ok(DIMS.depth < 1.2, "that much stretch reads as a rugby ball");
});
