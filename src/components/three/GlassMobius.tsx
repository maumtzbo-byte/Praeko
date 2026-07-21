"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshTransmissionMaterial } from "@react-three/drei";
import { BufferGeometry, DoubleSide, Float32BufferAttribute, type Mesh } from "three";

/** A continuous, single-surface twisted loop — a genuine Möbius strip, not
 * an illusion that only reads correctly from one locked angle (a Penrose
 * triangle breaks the moment it rotates). Built by hand instead of pulled
 * from three/examples/jsm to avoid that import path's bundler quirks.
 * Doubles as Praeko's own metaphor: one piece of input, endlessly becoming
 * output, looping without a seam. */
function buildMobiusGeometry(radius: number, width: number, uSegments: number, vSegments: number) {
  const positions: number[] = [];
  for (let i = 0; i <= uSegments; i++) {
    const u = (i / uSegments) * Math.PI * 2;
    for (let j = 0; j <= vSegments; j++) {
      const v = (j / vSegments - 0.5) * width;
      const x = (radius + v * Math.cos(u / 2)) * Math.cos(u);
      const y = (radius + v * Math.cos(u / 2)) * Math.sin(u);
      const z = v * Math.sin(u / 2);
      positions.push(x, y, z);
    }
  }

  const indices: number[] = [];
  const stride = vSegments + 1;
  // Deliberately no special seam handling at i = uSegments-1 -> uSegments:
  // the half-angle terms (u/2) already encode the twist, so the last row
  // (evaluated fresh at u = 2π, not copied from row 0) connects into the
  // first row correctly on its own.
  for (let i = 0; i < uSegments; i++) {
    for (let j = 0; j < vSegments; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function MobiusMesh({ spin }: { spin: boolean }) {
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => buildMobiusGeometry(1, 0.62, 160, 28), []);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    // Extremely subtle idle motion — a slow drift, not a spin — plus a
    // gentle vertical float. Skipped when spin is false (reduced motion),
    // leaving one static, fully-rendered frame.
    if (spin) {
      mesh.current.rotation.y += delta * 0.09;
      mesh.current.rotation.x = 0.5 + Math.sin(state.clock.getElapsedTime() * 0.15) * 0.05;
    }
    mesh.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.4) * 0.06;
  });

  return (
    <mesh ref={mesh} geometry={geometry} rotation={[0.5, 0, 0.15]}>
      {/* A Möbius strip is non-orientable — a single continuous formula
          can't keep triangle winding consistent all the way around, so
          roughly half the surface's faces end up wound "backward" relative
          to the other half. Without `side={DoubleSide}` those get
          backface-culled, which looked like most of the strip silently
          missing rather than a full loop. */}
      <MeshTransmissionMaterial
        color="#2f5fdb"
        thickness={0.6}
        roughness={0.12}
        transmission={0.55}
        ior={1.4}
        attenuationColor="#1a3aa8"
        attenuationDistance={0.6}
        chromaticAberration={0.02}
        anisotropy={0.1}
        distortion={0}
        temporalDistortion={0}
        clearcoat={1}
        clearcoatRoughness={0.08}
        envMapIntensity={1.8}
        side={DoubleSide}
        resolution={512}
      />
    </mesh>
  );
}

const SAFE_MATCH_MEDIA = "(prefers-reduced-motion: reduce)";

export default function GlassMobius({ className, active = true }: { className?: string; active?: boolean }) {
  // Only ever mounted client-side (dynamic import with ssr:false), so
  // reading matchMedia synchronously in the initializer is safe — no
  // hydration mismatch, no need for a post-mount effect+setState dance.
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
          <MobiusMesh spin={!reducedMotion} />
          {/* Procedural studio lighting — same recipe as LiquidMetalOrb, no
              external HDR fetch — tinted toward the brand's sapphire so the
              glass's own reflections read as "Praeko blue" rather than a
              neutral studio white. */}
          <Environment resolution={256}>
            <Lightformer intensity={2.4} color="#eaf1ff" position={[0, 4, -6]} scale={[10, 6, 1]} />
            <Lightformer intensity={1.8} color="white" position={[0, 0, 6]} scale={[8, 8, 1]} />
            <Lightformer intensity={1.6} color="#5f8ef2" position={[-6, 1, 3]} scale={[6, 10, 1]} rotation={[0, Math.PI / 3, 0]} />
            <Lightformer intensity={1.6} color="#c9daf9" position={[6, -1, 3]} scale={[6, 10, 1]} rotation={[0, -Math.PI / 3, 0]} />
            <Lightformer intensity={1} color="white" position={[0, -5, 2]} scale={[10, 4, 1]} />
          </Environment>
        </Suspense>
      </Canvas>
    </div>
  );
}
