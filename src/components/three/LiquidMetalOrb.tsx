"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshDistortMaterial } from "@react-three/drei";
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

function Orb({ progress, driftPoints }: { progress?: MotionValue<number>; driftPoints?: DriftPoint[] }) {
  const mesh = useRef<Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    // Read the scroll MotionValue directly instead of passing it as a React
    // prop each frame — keeps scroll-driven drift off the React render path
    // entirely, so it costs nothing beyond the r3f loop that's already running.
    const drift = progress && driftPoints ? lerpDrift(driftPoints, progress.get()) : { x: 0, y: 0, scale: 1 };

    mesh.current.rotation.x = Math.sin(t * 0.15) * 0.3 + pointer.current.y * 0.3;
    mesh.current.rotation.y = t * 0.12 + pointer.current.x * 0.3 + drift.x * 0.4;
    mesh.current.position.y = Math.sin(t * 0.6) * 0.15 + drift.y;
    mesh.current.position.x = drift.x;
    mesh.current.scale.setScalar(drift.scale);
  });

  return (
    <mesh
      ref={mesh}
      onPointerMove={(e) => {
        pointer.current = { x: e.uv ? e.uv.x - 0.5 : 0, y: e.uv ? e.uv.y - 0.5 : 0 };
      }}
    >
      <icosahedronGeometry args={[1.6, 24]} />
      <MeshDistortMaterial
        color="#eef0f2"
        roughness={0.22}
        metalness={0.85}
        distort={0.28}
        speed={1.4}
        envMapIntensity={1.8}
      />
    </mesh>
  );
}

export default function LiquidMetalOrb({
  className,
  progress,
  driftPoints,
}: {
  className?: string;
  /** Optional 0..1 scroll progress — when given with `driftPoints`, the orb drifts/scales along the story instead of just idling. */
  progress?: MotionValue<number>;
  driftPoints?: DriftPoint[];
}) {
  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[2, 3, 4]} intensity={1.2} />
          <Orb progress={progress} driftPoints={driftPoints} />
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
        </Suspense>
      </Canvas>
    </div>
  );
}
