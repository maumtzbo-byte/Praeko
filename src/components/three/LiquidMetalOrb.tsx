"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, MeshDistortMaterial } from "@react-three/drei";
import { Bloom, EffectComposer, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Suspense, useEffect, useRef } from "react";
import { Vector3, type BufferGeometry, type Mesh, type MeshPhysicalMaterial, type PerspectiveCamera } from "three";
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

// A fixed-size ring buffer of touch "ripples" — each one a point on the
// sphere's surface (in object space, normalized to a unit direction) plus
// the timestamp it was spawned. Dragging keeps overwriting the oldest slot
// with a fresh one, which is what makes a trail follow the finger/cursor
// instead of just a single point reacting.
const RIPPLE_SLOTS = 12;
const RIPPLE_DURATION_S = 0.9;
const RIPPLE_THROTTLE_S = 0.045;

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
  interactive,
}: {
  progress?: MotionValue<number>;
  driftPoints?: DriftPoint[];
  shotPoints?: ShotPoint[];
  cameraDistance: number;
  interactive?: boolean;
}) {
  const mesh = useRef<Mesh>(null);
  const geometry = useRef<BufferGeometry>(null);
  // Typed as the base three.js class — drei's own distort-material subclass
  // isn't exported, so `.distort` is accessed via a narrowing cast below.
  const material = useRef<MeshPhysicalMaterial>(null);
  // Smoothed (lerped) cursor position — reading state.pointer directly here
  // instead of a mesh-only onPointerMove means the whole canvas area drives
  // parallax, not just hovering the sphere's own surface.
  const smoothPointer = useRef({ x: 0, y: 0 });

  // The undisplaced sphere, captured once — every frame's ripple pass reads
  // from this and writes into the live position attribute, so ripples never
  // accumulate into a permanent deformation. Without a pristine copy to
  // rebuild from each frame, overlapping ripples would compound instead of
  // decaying, and the surface would never truly return to resting shape.
  const restPositions = useRef<Float32Array | null>(null);
  const ripples = useRef(
    Array.from({ length: RIPPLE_SLOTS }, () => ({ point: new Vector3(), start: -Infinity })),
  );
  const nextRippleSlot = useRef(0);
  const isDragging = useRef(false);
  const lastRippleAt = useRef(-Infinity);
  const hadActiveRipple = useRef(false);
  // Mirrors the clock so pointer handlers (outside useFrame) can stamp a
  // ripple using the same time base `t` reads below.
  const clockRef = useRef(0);

  useEffect(() => {
    if (!interactive || !geometry.current) return;
    const position = geometry.current.attributes.position;
    restPositions.current = Float32Array.from(position.array as Float32Array);
  }, [interactive]);

  function spawnRipple(localPoint: Vector3) {
    const slot = ripples.current[nextRippleSlot.current];
    slot.point.copy(localPoint).normalize();
    slot.start = clockRef.current;
    nextRippleSlot.current = (nextRippleSlot.current + 1) % RIPPLE_SLOTS;
    lastRippleAt.current = clockRef.current;
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (!interactive || !mesh.current) return;
    event.stopPropagation();
    isDragging.current = true;
    spawnRipple(mesh.current.worldToLocal(event.point.clone()));
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (!interactive || !isDragging.current || !mesh.current) return;
    if (clockRef.current - lastRippleAt.current < RIPPLE_THROTTLE_S) return;
    spawnRipple(mesh.current.worldToLocal(event.point.clone()));
  }

  useEffect(() => {
    if (!interactive) return;
    const stopDragging = () => {
      isDragging.current = false;
    };
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [interactive]);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.getElapsedTime();
    clockRef.current = t;
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
    if (material.current) {
      const baseDistort = progress ? 0.36 - storyProgress * 0.2 : 0.3;
      (material.current as DistortMaterialHandle).distort = baseDistort;
      if (progress) material.current.roughness = 0.2 - storyProgress * 0.1;
    }

    // Touch ripple: displaces the mesh's own vertex positions (fed straight
    // into MeshDistortMaterial's shader as its base shape, so its ambient
    // noise wobble layers on top for free) in a falloff around each active
    // ripple point — a real, localized bump where you touched, not a
    // whole-object reaction. Skipped entirely while idle, so resting
    // performance is untouched.
    if (interactive && geometry.current && restPositions.current) {
      const rest = restPositions.current;
      const active = ripples.current.filter((r) => {
        const age = t - r.start;
        return age >= 0 && age < RIPPLE_DURATION_S;
      });
      if (active.length > 0) {
        const position = geometry.current.attributes.position;
        const count = position.count;
        for (let i = 0; i < count; i++) {
          const ox = rest[i * 3];
          const oy = rest[i * 3 + 1];
          const oz = rest[i * 3 + 2];
          const len = Math.hypot(ox, oy, oz) || 1;
          const nx = ox / len;
          const ny = oy / len;
          const nz = oz / len;
          let bump = 0;
          for (const r of active) {
            const age = t - r.start;
            const dx = nx - r.point.x;
            const dy = ny - r.point.y;
            const dz = nz - r.point.z;
            const falloff = Math.exp(-(dx * dx + dy * dy + dz * dz) * 5.5);
            const envelope = Math.sin(age * 16) * Math.exp(-age * 4.5);
            bump += falloff * envelope * 0.32;
          }
          position.setXYZ(i, ox + nx * bump, oy + ny * bump, oz + nz * bump);
        }
        // Deliberately not calling computeVertexNormals() here: this
        // geometry (like all Polyhedron-based Three.js geometries) is
        // non-indexed — each triangle owns its own unmerged corners — so
        // recomputing normals from face adjacency degrades to flat
        // per-triangle shading with no vertices to average across, instead
        // of the smooth analytic normals (normalize(position), already
        // correct for a near-sphere) the geometry ships with. Leaving the
        // original normals in place, slightly "wrong" at the very peak of
        // a bump, reads far smoother than that faceting did.
        position.needsUpdate = true;
        hadActiveRipple.current = true;
      } else if (hadActiveRipple.current) {
        // Every ripple has fully decayed — snap back to the pristine sphere
        // exactly, so no fractional floating-point residue lingers.
        const position = geometry.current.attributes.position;
        (position.array as Float32Array).set(rest);
        position.needsUpdate = true;
        hadActiveRipple.current = false;
      }
    }
  });

  return (
    <mesh
      ref={mesh}
      onPointerDown={interactive ? handlePointerDown : undefined}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerOver={interactive ? () => (document.body.style.cursor = "pointer") : undefined}
      onPointerOut={interactive ? () => (document.body.style.cursor = "auto") : undefined}
    >
      <icosahedronGeometry ref={geometry} args={[1.6, 32]} />
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
  interactive = false,
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
  /** Lets clicking/tapping the orb trigger a decaying impact wobble — off by default since ScrollStory's beats drive pointer events for scroll-hijacking instead. */
  interactive?: boolean;
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
          <Orb
            progress={progress}
            driftPoints={driftPoints}
            shotPoints={shotPoints}
            cameraDistance={cameraDistance}
            interactive={interactive}
          />
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
