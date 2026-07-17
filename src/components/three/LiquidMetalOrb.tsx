"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshDistortMaterial } from "@react-three/drei";
import { Bloom, EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";
import type { MotionValue } from "framer-motion";

interface DriftPoint {
  x: number;
  y: number;
  scale: number;
}

/** Linear interpolation across evenly-spaced control points, read fresh every r3f frame. */
function lerpDrift(points: DriftPoint[], t: number): DriftPoint {
  const clamped = Math.min(Math.max(t, 0), 1);
  const segment = 1 / (points.length - 1);
  const idx = Math.min(Math.floor(clamped / segment), points.length - 2);
  const localT = (clamped - idx * segment) / segment;
  const a = points[idx];
  const b = points[idx + 1];
  return {
    x: a.x + (b.x - a.x) * localT,
    y: a.y + (b.y - a.y) * localT,
    scale: a.scale + (b.scale - a.scale) * localT,
  };
}

function Orb({
  progress,
  driftPoints,
  cameraDistance,
}: {
  progress?: MotionValue<number>;
  driftPoints?: DriftPoint[];
  cameraDistance: number;
}) {
  const mesh = useRef<Mesh>(null);
  // Smoothed (lerped) cursor position — reading state.pointer directly here
  // instead of a mesh-only onPointerMove means the whole canvas area drives
  // parallax, not just hovering the sphere's own surface.
  const smoothPointer = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    const drift = progress && driftPoints ? lerpDrift(driftPoints, progress.get()) : { x: 0, y: 0, scale: 1 };

    smoothPointer.current.x += (state.pointer.x - smoothPointer.current.x) * 0.04;
    smoothPointer.current.y += (state.pointer.y - smoothPointer.current.y) * 0.04;

    mesh.current.rotation.x = Math.sin(t * 0.15) * 0.3 + smoothPointer.current.y * 0.25;
    mesh.current.rotation.y = t * 0.12 + smoothPointer.current.x * 0.25 + drift.x * 0.4;
    mesh.current.position.y = Math.sin(t * 0.6) * 0.15 + drift.y;
    mesh.current.position.x = drift.x;
    mesh.current.scale.setScalar(drift.scale);

    // Camera parallax + a gentle scroll-driven dolly-in — this is what makes
    // the scene read as a space with depth rather than a flat rendered sticker.
    state.camera.position.x = smoothPointer.current.x * 0.22;
    state.camera.position.y = smoothPointer.current.y * 0.13;
    state.camera.position.z = cameraDistance - (progress ? progress.get() * 0.5 : 0);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.6, 32]} />
      <MeshDistortMaterial
        color="#f0f1f3"
        roughness={0.14}
        metalness={0.9}
        clearcoat={1}
        clearcoatRoughness={0.1}
        distort={0.3}
        speed={1.3}
        envMapIntensity={2.2}
      />
    </mesh>
  );
}

export default function LiquidMetalOrb({
  className,
  progress,
  driftPoints,
  fov = 40,
  cameraDistance = 5,
  cinematic = false,
  edgeFade = false,
}: {
  className?: string;
  /** Optional 0..1 scroll progress — when given with `driftPoints`, the orb drifts/scales along the story instead of just idling. */
  progress?: MotionValue<number>;
  driftPoints?: DriftPoint[];
  /** Camera field of view in degrees. Defaults to the original Hero framing. */
  fov?: number;
  /** Camera distance from the orb. Defaults to the original Hero framing. */
  cameraDistance?: number;
  /** Enables bloom + subtle film grain — off by default so Hero's look is untouched. */
  cinematic?: boolean;
  /** Fades the canvas to transparent well before its own box edge via a CSS radial mask, so a fixed-size container never shows a hard clip line. */
  edgeFade?: boolean;
}) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={
        edgeFade
          ? {
              maskImage: "radial-gradient(circle, black 52%, transparent 80%)",
              WebkitMaskImage: "radial-gradient(circle, black 52%, transparent 80%)",
            }
          : undefined
      }
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, cameraDistance], fov }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[2, 3, 4]} intensity={1.2} />
          <Orb progress={progress} driftPoints={driftPoints} cameraDistance={cameraDistance} />
          {/* Procedural studio lighting rig — no external HDR fetch required. */}
          <Environment resolution={256}>
            <Lightformer
              intensity={2.5}
              color="white"
              position={[0, 4, -6]}
              scale={[10, 6, 1]}
            />
            <Lightformer
              intensity={2}
              color="white"
              position={[0, 0, 6]}
              scale={[10, 10, 1]}
            />
            <Lightformer
              intensity={1.8}
              color="white"
              position={[-6, 1, 3]}
              scale={[6, 10, 1]}
              rotation={[0, Math.PI / 3, 0]}
            />
            <Lightformer
              intensity={1.8}
              color="white"
              position={[6, -1, 3]}
              scale={[6, 10, 1]}
              rotation={[0, -Math.PI / 3, 0]}
            />
            <Lightformer
              intensity={1.2}
              color="white"
              position={[0, -5, 2]}
              scale={[10, 4, 1]}
            />
          </Environment>
          {cinematic && (
            <EffectComposer multisampling={0}>
              <Bloom intensity={0.35} luminanceThreshold={0.55} luminanceSmoothing={0.9} radius={0.5} mipmapBlur />
              <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.02} />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
