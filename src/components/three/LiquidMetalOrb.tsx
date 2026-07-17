"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshDistortMaterial } from "@react-three/drei";
import { Bloom, EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense, useRef } from "react";
import type { Mesh, MeshPhysicalMaterial, PerspectiveCamera } from "three";
import type { MotionValue } from "framer-motion";

type DistortMaterialHandle = MeshPhysicalMaterial & { distort: number };

type DriftPoint = {
  x: number;
  y: number;
  scale: number;
};

type ShotPoint = {
  distance: number;
  fov: number;
};

/** Linear interpolation across evenly-spaced control points, read fresh every r3f frame. */
function lerpPoints<T extends object>(points: T[], t: number): T {
  const clamped = Math.min(Math.max(t, 0), 1);
  const segment = 1 / (points.length - 1);
  const idx = Math.min(Math.floor(clamped / segment), points.length - 2);
  const localT = (clamped - idx * segment) / segment;
  const a = points[idx] as Record<string, number>;
  const b = points[idx + 1] as Record<string, number>;
  const result: Record<string, number> = {};
  for (const key of Object.keys(a)) {
    result[key] = a[key] + (b[key] - a[key]) * localT;
  }
  return result as T;
}

function Orb({
  progress,
  driftPoints,
  shotPoints,
  cameraDistance,
}: {
  progress?: MotionValue<number>;
  driftPoints?: DriftPoint[];
  shotPoints?: ShotPoint[];
  cameraDistance: number;
}) {
  const mesh = useRef<Mesh>(null);
  // Typed as the base three.js class — drei's own distort-material subclass
  // isn't exported, so `.distort` is accessed via a narrowing cast below.
  const material = useRef<MeshPhysicalMaterial>(null);
  // Smoothed (lerped) cursor position — reading state.pointer directly here
  // instead of a mesh-only onPointerMove means the whole canvas area drives
  // parallax, not just hovering the sphere's own surface.
  const smoothPointer = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    const storyProgress = progress ? progress.get() : 0;
    const drift = progress && driftPoints ? lerpPoints(driftPoints, storyProgress) : { x: 0, y: 0, scale: 1 };

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

    if (progress && shotPoints) {
      // Per-beat "shots" — distance and field of view both interpolated, so
      // each beat reads as its own directed camera setup (wide establishing,
      // tight macro, pulled-back reveal) instead of one fixed framing.
      const shot = lerpPoints(shotPoints, storyProgress);
      state.camera.position.z = shot.distance;
      if ("fov" in state.camera) {
        const camera = state.camera as PerspectiveCamera;
        camera.fov = shot.fov;
        camera.updateProjectionMatrix();
      }
    } else {
      state.camera.position.z = cameraDistance - (progress ? storyProgress * 0.5 : 0);
    }
    state.camera.lookAt(0, 0, 0);

    // Narrative arc: the metal is more turbulent at the start of the story
    // and settles into a calmer, glossier surface by the final beat — chaos
    // of daily work resolving into clarity, echoed in the material itself.
    if (progress && material.current) {
      (material.current as DistortMaterialHandle).distort = 0.36 - storyProgress * 0.2;
      material.current.roughness = 0.2 - storyProgress * 0.1;
    }
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1.6, 32]} />
      <MeshDistortMaterial
        ref={(instance) => {
          material.current = instance;
        }}
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
  shotPoints,
  fov = 40,
  cameraDistance = 5,
  cinematic = false,
  edgeFade = false,
}: {
  className?: string;
  /** Optional 0..1 scroll progress — when given with `driftPoints`, the orb drifts/scales along the story instead of just idling. */
  progress?: MotionValue<number>;
  driftPoints?: DriftPoint[];
  /** Optional per-beat camera distance/fov control points — when given with `progress`, overrides the fixed dolly with distinct per-beat "shots". */
  shotPoints?: ShotPoint[];
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
          <Orb progress={progress} driftPoints={driftPoints} shotPoints={shotPoints} cameraDistance={cameraDistance} />
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
