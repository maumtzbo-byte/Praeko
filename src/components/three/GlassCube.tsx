"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshTransmissionMaterial, RoundedBox } from "@react-three/drei";
import type { Mesh } from "three";

/** Praeko's hero object, take two — a solid-feeling glass cube instead of
 * the earlier Möbius strip. A cube reads as grounded and simple rather
 * than "look at this shader," which fits the pivot away from a glossy
 * chrome-and-blue signature toward the forest-green/beige identity —
 * the same material language as the recolored P mark, just in 3D. */
function CubeMesh({ spin }: { spin: boolean }) {
  const mesh = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    if (spin) {
      mesh.current.rotation.y += delta * 0.12;
      mesh.current.rotation.x = 0.55 + Math.sin(state.clock.getElapsedTime() * 0.18) * 0.08;
    }
    mesh.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.4) * 0.08;
  });

  return (
    <RoundedBox ref={mesh} args={[1.7, 1.7, 1.7]} radius={0.14} smoothness={6} rotation={[0.55, 0.5, 0.1]}>
      <MeshTransmissionMaterial
        color="#1e6b4c"
        thickness={1.1}
        roughness={0.1}
        transmission={0.5}
        ior={1.45}
        attenuationColor="#0a2e23"
        attenuationDistance={0.7}
        chromaticAberration={0.02}
        anisotropy={0.1}
        distortion={0}
        temporalDistortion={0}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={1.7}
        resolution={512}
      />
    </RoundedBox>
  );
}

const SAFE_MATCH_MEDIA = "(prefers-reduced-motion: reduce)";

export default function GlassCube({ className, active = true }: { className?: string; active?: boolean }) {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(SAFE_MATCH_MEDIA).matches);

  useEffect(() => {
    const mql = window.matchMedia(SAFE_MATCH_MEDIA);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.4], fov: 36 }}
        gl={{ antialias: true, alpha: true }}
        frameloop={reducedMotion || !active ? "demand" : "always"}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 4]} intensity={0.9} />
          <CubeMesh spin={!reducedMotion} />
          {/* Procedural studio lighting, warm this time — sand/cream and a
              beige rim light instead of blue, so the glass's own
              reflections pick up "Praeko warm" rather than a cold studio
              white, matching the highlight streak on the P mark. */}
          <Environment resolution={256}>
            <Lightformer intensity={2.4} color="#f4eee5" position={[0, 4, -6]} scale={[10, 6, 1]} />
            <Lightformer intensity={1.8} color="white" position={[0, 0, 6]} scale={[8, 8, 1]} />
            <Lightformer intensity={1.7} color="#c9b896" position={[-6, 1, 3]} scale={[6, 10, 1]} rotation={[0, Math.PI / 3, 0]} />
            <Lightformer intensity={1.5} color="#ece3d8" position={[6, -1, 3]} scale={[6, 10, 1]} rotation={[0, -Math.PI / 3, 0]} />
            <Lightformer intensity={1} color="white" position={[0, -5, 2]} scale={[10, 4, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
}
