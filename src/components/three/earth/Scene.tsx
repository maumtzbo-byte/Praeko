"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Earth } from "./Earth";

const SAFE_MATCH_MEDIA = "(prefers-reduced-motion: reduce)";

// Plain flat-shaded sphere while textures stream in — same silhouette as
// the real thing, no network round trip, avoids a blank hole where the
// globe will be for however long the ~1MB of textures take to arrive.
function EarthLoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshBasicMaterial color="#cfe0ef" />
    </mesh>
  );
}

/** Self-contained: mounts nothing (no Canvas, no WebGL context, no
 * texture fetch) until it's actually scrolled near the viewport, and
 * respects `prefers-reduced-motion` throughout — same "don't spend GPU/
 * battery/bandwidth on a scene nobody's looking at yet" pattern already
 * used for the Hero's own 3D object before it was removed. Callers just
 * drop `<EarthScene className="h-64 w-64" />` in; no external wiring. */
export default function EarthScene({ className }: { className?: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(SAFE_MATCH_MEDIA);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount read of a client-only API (matchMedia), not derivable during render.
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className={`relative overflow-hidden bg-white ${className ?? ""}`}>
      {visible && (
        <Canvas
          dpr={[1, 2]}
          camera={{ fov: 35, position: [0, 0.55, 4.3] }}
          gl={{ antialias: true, alpha: true }}
          frameloop={reducedMotion ? "demand" : "always"}
        >
          <ambientLight intensity={0.5} />
          {/* The one hard light — a "sun" from the upper right, matching
              the Apple-keynote key-light composition. Everything else
              below is soft fill, not another shadow-casting source. */}
          <directionalLight position={[3.5, 2.2, 2.5]} intensity={1.8} />

          {/* Procedural HDR-ish fill via drei's Lightformer rig — soft
              ambient bounce without loading an external HDRI file. */}
          <Environment resolution={128}>
            <Lightformer intensity={1.2} color="#ffffff" position={[0, 3, -4]} scale={[10, 6, 1]} />
            <Lightformer intensity={0.6} color="#bcdcf0" position={[-5, -1, 2]} scale={[6, 8, 1]} />
          </Environment>

          <Suspense fallback={<EarthLoadingFallback />}>
            <Earth reducedMotion={reducedMotion} />
          </Suspense>

          {/* Damped, auto-rotating, but boxed in — no zoom, no pan, and
              the polar angle is clamped so a dragged rotation can never
              flip the globe upside down or show it edge-on. */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.4}
            autoRotate={!reducedMotion}
            autoRotateSpeed={0.35}
            minPolarAngle={Math.PI / 2 - 0.5}
            maxPolarAngle={Math.PI / 2 + 0.35}
            target={[0, 0, 0]}
          />

          {!reducedMotion && (
            <EffectComposer>
              <Bloom luminanceThreshold={0.95} intensity={0.15} mipmapBlur radius={0.3} />
            </EffectComposer>
          )}
        </Canvas>
      )}

      {/* Bottom fade-to-white — the globe sinks into the page instead of
          ending on a hard circular edge, same as the reference. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-white" />
    </div>
  );
}
