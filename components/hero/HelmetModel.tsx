"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Vector2 } from "three";
import type { Group } from "three";
import {
  CHIN_VENT,
  DIMS,
  PIVOT,
  SHELL_PROFILE,
  VENTS,
  VENT_BLANK_RADIUS,
  chinSurfaceZ,
  pivotPosition,
  ventPosition,
} from "@/lib/helmet-shape.ts";

/**
 * A full-face road helmet — the LS2/Axor shape that fills Kathmandu traffic —
 * built from geometry rather than a downloaded asset: no licence to honour,
 * no multi-megabyte GLB, and every proportion tunable in `lib/helmet-shape.ts`.
 *
 * The helmet faces +Z. In three.js sphere geometry +Z sits at phi = PI/2, so
 * front-facing bands start half their width before it.
 */

const FRONT = Math.PI / 2;
const DOUBLE_SIDED = 2;

const SHELL = { color: "#1c1c21", roughness: 0.44 } as const;
const TRIM = { color: "#0b0b0e", roughness: 0.82 } as const;

function Vent({
  position,
  scale,
}: {
  position: [number, number, number];
  scale: [number, number, number];
}) {
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[VENT_BLANK_RADIUS, 32, 24]} />
      <meshStandardMaterial {...TRIM} />
    </mesh>
  );
}

/** One meridian of the crown stripe: +1 over the front, -1 over the back. */
function Stripe({ side }: { side: 1 | -1 }) {
  const { radius, halfWidth } = DIMS.stripe;
  return (
    <mesh>
      <sphereGeometry
        args={[
          radius,
          24,
          48,
          side * FRONT - halfWidth,
          halfWidth * 2,
          0.04,
          1.45,
        ]}
      />
      <meshPhysicalMaterial
        color="#ff5a1f"
        roughness={0.32}
        clearcoat={1}
        clearcoatRoughness={0.2}
        side={DOUBLE_SIDED}
      />
    </mesh>
  );
}

export function HelmetModel({ scale = 1.32 }: { scale?: number }) {
  const group = useRef<Group>(null);
  const profile = useMemo(
    () => SHELL_PROFILE.map(([x, y]) => new Vector2(x, y)),
    [],
  );

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.25;
  });

  return (
    <group ref={group} scale={scale} rotation={[-0.04, 0, 0]}>
      <group scale={[1, 1, DIMS.depth]}>
        {/* shell */}
        <mesh castShadow>
          <latheGeometry args={[profile, 96]} />
          <meshPhysicalMaterial
            {...SHELL}
            clearcoat={1}
            clearcoatRoughness={0.26}
          />
        </mesh>

        {/* eyeport surround, then the smoked visor sitting inside it */}
        <mesh>
          <sphereGeometry
            args={[
              DIMS.eyeport.radius,
              64,
              32,
              FRONT - DIMS.eyeport.phi / 2,
              DIMS.eyeport.phi,
              DIMS.eyeport.thetaStart,
              DIMS.eyeport.thetaLength,
            ]}
          />
          <meshStandardMaterial {...TRIM} side={DOUBLE_SIDED} />
        </mesh>
        <mesh>
          <sphereGeometry
            args={[
              DIMS.visor.radius,
              64,
              32,
              FRONT - DIMS.visor.phi / 2,
              DIMS.visor.phi,
              DIMS.visor.thetaStart,
              DIMS.visor.thetaLength,
            ]}
          />
          <meshPhysicalMaterial
            color="#14161c"
            roughness={0.06}
            metalness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.04}
            envMapIntensity={1.6}
            transparent
            opacity={0.94}
            side={DOUBLE_SIDED}
          />
        </mesh>

        {/* chin bar */}
        <mesh
          position={DIMS.chin.position}
          scale={DIMS.chin.scale}
          castShadow
        >
          <sphereGeometry args={[DIMS.chin.radius, 48, 32]} />
          <meshPhysicalMaterial
            {...SHELL}
            clearcoat={1}
            clearcoatRoughness={0.26}
          />
        </mesh>
        {/* chin vent, on the chin bar's front face */}
        <Vent
          position={[0, CHIN_VENT.y, chinSurfaceZ(CHIN_VENT.y)]}
          scale={CHIN_VENT.scale}
        />

        {/* brow, crown and rear vents, each placed on the shell surface */}
        {VENTS.map((vent) => (
          <Vent key={vent.id} position={ventPosition(vent)} scale={vent.scale} />
        ))}

        {/* visor pivot bosses */}
        {([-1, 1] as const).map((side) => (
          <mesh
            key={side}
            position={pivotPosition(side)}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry
              args={[PIVOT.radius, PIVOT.radius, PIVOT.thickness, 24]}
            />
            <meshStandardMaterial color="#2b2d33" roughness={0.5} />
          </mesh>
        ))}

        <Stripe side={1} />
        <Stripe side={-1} />
      </group>

      {/* neck roll */}
      <mesh position={[0, -0.84, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.44, 0.1, 16, 48]} />
        <meshStandardMaterial color="#0d0d11" roughness={0.95} />
      </mesh>
    </group>
  );
}
