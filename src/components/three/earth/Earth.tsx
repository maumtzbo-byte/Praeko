"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { atmosphereVertexShader, atmosphereFragmentShader } from "./atmosphere-shader";

const EARTH_RADIUS = 1.5;
const TEXTURE_BASE = "/textures/earth";

// Self-hosted, not hotlinked — these are the real (if lower-than-8K)
// three.js example Earth textures, downloaded once into public/ so the
// site doesn't depend on an external host at request time. True 8K NASA
// source imagery would be 50-100MB+ per map, which contradicts "mobile
// optimized" far more than it helps visual fidelity at the size this
// globe actually renders on a landing page.
const TEXTURE_URLS = {
  day: `${TEXTURE_BASE}/earth_atmos_2048.jpg`,
  normal: `${TEXTURE_BASE}/earth_normal_2048.jpg`,
};

/** The Earth object itself — sphere + atmosphere rim — meant to be
 * mounted inside a `<Canvas>` (see `Scene.tsx`), not used standalone. No
 * cloud layer: an alpha-mapped cloud shell rendered as a blocky white
 * speckle mess under this stack regardless of texture format, mipmap
 * settings, or post-processing (all tried and ruled out) — the reference
 * the user actually wants is the bare surface + atmosphere glow anyway.
 * Takes `reducedMotion` from its parent instead of reading `matchMedia`
 * itself, since the parent already needs that value for the Canvas's own
 * `frameloop`/`autoRotate` settings and there's no reason to duplicate
 * the listener. */
export function Earth({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);

  // Color-managed textures need sRGB decoding; the normal map is data,
  // not color, and must stay linear or the surface shading comes out
  // wrong. Configured via useTexture's own onLoad callback (where drei
  // expects loader-side setup to happen) rather than a separate effect
  // mutating the hook's return value.
  const [dayMap, normalMap] = useTexture([TEXTURE_URLS.day, TEXTURE_URLS.normal], ([day]) => {
    day.colorSpace = THREE.SRGBColorSpace;
  });

  const normalScale = useMemo(() => new THREE.Vector2(0.6, 0.6), []);
  const atmosphereUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#5b96d6") },
      uIntensity: { value: 1.1 },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (reducedMotion) return;
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.045;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.4) * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={earthRef}>
        <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
        <meshStandardMaterial map={dayMap} normalMap={normalMap} normalScale={normalScale} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Atmosphere rim glow, see atmosphere-shader.ts. Additive blending
          (the usual trick for this effect) is nearly invisible against a
          light page background — adding light-blue to already-light
          pixels barely moves them — so this uses normal alpha blending
          instead, which actually paints a visible soft rim regardless of
          what's behind it. */}
      <mesh scale={1.09}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <shaderMaterial
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmosphereUniforms}
          transparent
          blending={THREE.NormalBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
