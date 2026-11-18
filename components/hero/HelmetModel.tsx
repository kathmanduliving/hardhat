"use client";

import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";

useGLTF.preload("/models/helmet.glb");

export function HelmetModel() {
  const group = useRef<Group>(null);
  const { scene } = useGLTF("/models/helmet.glb");

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.25;
  });

  return (
    <group ref={group} scale={2.1} position={[0, 0.1, 0]}>
      <primitive object={scene} />
    </group>
  );
}
