"use client";

import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import { Suspense } from "react";
import { HelmetModel } from "./HelmetModel.tsx";

/** Loaded lazily by Hero3D, so three.js never ships to clients without WebGL. */
export default function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 38 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.35} />
        <spotLight
          position={[5, 6, 5]}
          angle={0.35}
          penumbra={1}
          intensity={160}
        />
        <pointLight position={[-5, -2, -4]} intensity={40} color="#ff5a1f" />
        <HelmetModel />
        <ContactShadows
          position={[0, -1.7, 0]}
          opacity={0.55}
          scale={10}
          blur={2.6}
          far={3}
        />
        {/* Built from lightformers, so no HDRI is fetched at runtime. */}
        <Environment resolution={256}>
          <Lightformer intensity={2.2} position={[0, 4, -6]} scale={[12, 6, 1]} />
          <Lightformer
            intensity={1.4}
            position={[-6, 1, 2]}
            rotation-y={Math.PI / 2}
            scale={[8, 6, 1]}
          />
          <Lightformer
            intensity={2}
            color="#ff5a1f"
            position={[6, 0, 2]}
            rotation-y={-Math.PI / 2}
            scale={[8, 4, 1]}
          />
        </Environment>
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
}
