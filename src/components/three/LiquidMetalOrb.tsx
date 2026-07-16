"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshDistortMaterial } from "@react-three/drei";
import { Suspense, useRef } from "react";
import type { Mesh } from "three";

function Orb() {
  const mesh = useRef<Mesh>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = Math.sin(t * 0.15) * 0.3 + pointer.current.y * 0.3;
    mesh.current.rotation.y = t * 0.12 + pointer.current.x * 0.3;
    mesh.current.position.y = Math.sin(t * 0.6) * 0.15;
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

export default function LiquidMetalOrb({ className }: { className?: string }) {
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
          <Orb />
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
