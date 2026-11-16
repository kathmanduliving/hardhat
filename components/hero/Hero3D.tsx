"use client";

import dynamic from "next/dynamic";
import { Component, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { HelmetArt } from "@/components/HelmetArt.tsx";

// `ssr: false` is only legal inside a client component, which this is.
const HeroCanvas = dynamic(() => import("./HeroCanvas.tsx"), { ssr: false });

/** Shown until WebGL is confirmed, and whenever 3D is unwanted or broken. */
function Fallback() {
  return (
    <div className="flex size-full items-center justify-center">
      <HelmetArt seed="hero" hex="#3f4248" className="h-[70%] max-h-130" />
    </div>
  );
}

class CanvasBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}

// The answer cannot change for the life of the document, so it is read once
// and never subscribed to.
const neverChanges = () => () => {};
let detected: boolean | null = null;

function detect(): boolean {
  if (detected === null) {
    try {
      detected =
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        !!document.createElement("canvas").getContext("webgl2");
    } catch {
      detected = false;
    }
  }
  return detected;
}

/** True only when the browser can and should run WebGL here. */
function use3DEnabled(): boolean {
  return useSyncExternalStore(neverChanges, detect, () => false);
}

export function Hero3D() {
  const enabled = use3DEnabled();
  if (!enabled) return <Fallback />;

  return (
    <CanvasBoundary>
      <HeroCanvas />
    </CanvasBoundary>
  );
}
