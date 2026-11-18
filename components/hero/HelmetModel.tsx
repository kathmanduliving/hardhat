"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";
import { heroFit } from "@/lib/hero-fit.ts";

useGLTF.preload("/models/helmet.glb");

export function HelmetModel() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF("/models/helmet.glb");
  // Portrait viewports see far less world width than desktop ones at the same
  // camera distance, so size and height follow the viewport.
  const viewportWidth = useThree((state) => state.viewport.width);
  const { scale, y } = heroFit(viewportWidth);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.25;
  });

  return (
    <group ref={group} scale={scale} position={[0, y, 0]}>
      <primitive object={scene} />
    </group>
  );
}
