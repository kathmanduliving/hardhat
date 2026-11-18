"use client";

import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";

import { heroFit } from "@/lib/hero-fit.ts";
import { HelmetModel } from "./HelmetModel.tsx";

/** The shadow has to follow the helmet, which moves with the viewport. */
function HelmetShadow() {
  const { shadowY } = heroFit(useThree((state) => state.viewport.width));
  return (
    <ContactShadows
      position={[0, shadowY, 0]}
      opacity={0.55}
      scale={10}
      blur={2.6}
      far={3}
    />
  );
}

/**
 * Orbiting needs a mouse and no touchscreen at all. OrbitControls sets
 * `touch-action: none` on the canvas, which swallows the swipe that should
 * scroll past this 88svh hero — on a phone, and equally on a touchscreen
 * laptop, where the primary pointer is fine but fingers still work. Scrolling
 * matters more than orbiting, so those devices just get the auto-rotation.
 * The hint in app/page.tsx mirrors this test in CSS and must stay in step.
 *
 * This module only ever runs in the browser (Hero3D imports it with
 * `ssr: false`).
 */
const canOrbit =
  window.matchMedia("(pointer: fine)").matches &&
  !window.matchMedia("(any-pointer: coarse)").matches;

/** True while any part of `ref` is on screen. */
function useOnScreen(ref: React.RefObject<HTMLElement | null>): boolean {
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return onScreen;
}

/** Loaded lazily by Hero3D, so three.js never ships to clients without WebGL. */
export default function HeroCanvas() {
  const box = useRef<HTMLDivElement>(null);
  // Scrolled past the hero, the loop would keep burning GPU and battery.
  const onScreen = useOnScreen(box);

  return (
    <div ref={box} className="size-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 38 }}
        dpr={canOrbit ? [1, 2] : [1, 1.5]}
        frameloop={onScreen ? "always" : "never"}
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
          <HelmetShadow />
          {/* Built from lightformers, so no HDRI is fetched at runtime. */}
          <Environment resolution={256}>
            <Lightformer
              intensity={2.2}
              position={[0, 4, -6]}
              scale={[12, 6, 1]}
            />
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
        {canOrbit && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
          />
        )}
      </Canvas>
    </div>
  );
}
