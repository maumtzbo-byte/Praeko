"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "framer-motion";
import { hasSeenIntro, markIntroSeen } from "@/lib/marketing/intro-session";

const SMALL_CUBE_SIZE = 34;
const BIG_CUBE_SIZE = 68;
const SCATTER_RADIUS = 74;
const CUBE_COUNT = 5;

/** The three visible faces of an isometric cube, built from real 3D
 * transforms on an ancestor with no `perspective` set — omitting perspective
 * turns 3D transforms into an orthographic (no vanishing point) projection,
 * which is what an isometric cube actually is. Shaded in the brand's forest
 * greens/cream instead of the generic gray/carbon of a typical isometric
 * loader, so it still reads as Praeko rather than a stock loading spinner. */
function CubeFaces({ size }: { size: number }) {
  const half = size / 2;
  return (
    <>
      <div
        className="absolute"
        style={{ width: size, height: size, background: "var(--aurora-highlight)", transform: `rotateX(90deg) translateZ(${half}px)` }}
      />
      <div
        className="absolute"
        style={{ width: size, height: size, background: "var(--accent)", transform: `translateZ(${half}px)` }}
      />
      <div
        className="absolute"
        style={{ width: size, height: size, background: "var(--aurora-deep)", transform: `rotateY(-90deg) translateZ(${half}px)` }}
      />
    </>
  );
}

/** Small cubes drift in a loose scattered ring while the page is still
 * loading (an indeterminate loop — `done` decides only when to cut it, not
 * how any single frame looks, since a cube loader has no natural notion of
 * "60% filled" the way text does). Once `done`, they converge and fuse into
 * one larger cube, and the "PRAEKO" wordmark settles in underneath it —
 * keeping a brand moment in the loader even though the animation itself is
 * no longer the wordmark being drawn letter by letter. */
function IsometricLoader({ done, reducedMotion }: { done: boolean; reducedMotion: boolean }) {
  const cubes = useMemo(
    () =>
      Array.from({ length: CUBE_COUNT }, (_, i) => {
        const angle = (i / CUBE_COUNT) * Math.PI * 2;
        return { id: i, x: Math.cos(angle) * SCATTER_RADIUS, y: Math.sin(angle) * SCATTER_RADIUS, delay: i * 0.15 };
      }),
    [],
  );

  return (
    <div className="relative" style={{ width: 220, height: 220 }}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transform: "rotateX(-30deg) rotateY(45deg)" }}>
        {cubes.map((cube) => (
          <motion.div
            key={cube.id}
            className="absolute left-1/2 top-1/2"
            style={{ transformStyle: "preserve-3d" }}
            initial={false}
            animate={
              done
                ? { x: 0, y: 0, rotateZ: 0, scale: 0, opacity: 0 }
                : { x: [cube.x, cube.x * 0.85, cube.x], y: [cube.y - 10, cube.y + 10, cube.y - 10], rotateZ: [0, 12, 0] }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : done
                  ? { duration: 0.5, ease: "easeInOut", delay: cube.delay * 0.4 }
                  : { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: cube.delay }
            }
          >
            <div
              className="relative"
              style={{
                transformStyle: "preserve-3d",
                width: SMALL_CUBE_SIZE,
                height: SMALL_CUBE_SIZE,
                marginLeft: -SMALL_CUBE_SIZE / 2,
                marginTop: -SMALL_CUBE_SIZE / 2,
              }}
            >
              <CubeFaces size={SMALL_CUBE_SIZE} />
            </div>
          </motion.div>
        ))}

        <motion.div
          className="absolute left-1/2 top-1/2"
          style={{ transformStyle: "preserve-3d" }}
          initial={false}
          animate={done ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 22, delay: done ? 0.35 : 0 }}
        >
          <div
            className="relative"
            style={{
              transformStyle: "preserve-3d",
              width: BIG_CUBE_SIZE,
              height: BIG_CUBE_SIZE,
              marginLeft: -BIG_CUBE_SIZE / 2,
              marginTop: -BIG_CUBE_SIZE / 2,
            }}
          >
            <CubeFaces size={BIG_CUBE_SIZE} />
          </div>
        </motion.div>
      </div>

      <motion.div
        className="absolute inset-x-0 bottom-4 flex justify-center"
        initial={false}
        animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.4, delay: done ? 0.55 : 0 }}
      >
        <span className="aurora-text text-lg font-semibold tracking-[0.35em]">PRAEKO</span>
      </motion.div>
    </div>
  );
}

const SAFETY_TIMEOUT_MS = 7000;
// Long enough for the cube-convergence -> fuse -> wordmark sequence in
// IsometricLoader to actually finish playing (it lands around ~950ms after
// `done`) before the exit animation cuts it off — was 450ms under the old
// letter-fill visual, which resolved instantly the moment progress hit 1.
const HOLD_AFTER_COMPLETE_MS = 1150;
const TRICKLE_CAP = 0.92;

/** Drives a 0-1 progress value from real page-load signals rather than a
 * fixed timer: it trickles toward a cap while the page is still loading
 * (so there's always visible motion) but can only actually finish once
 * `window.load` fires — a slow connection stalls near the cap for as long
 * as loading genuinely takes, a fast/cached load barely trickles before
 * jumping straight to complete. */
function useLoadProgress() {
  const progress = useMotionValue(0.04);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      progress.set(1);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate one-time post-mount read of a client-only API (matchMedia), not derivable during render.
      setDone(true);
      return;
    }

    let raf: number;
    let finished = false;

    function finish() {
      if (finished) return;
      finished = true;
      const controls = animate(progress, 1, { duration: 0.35, ease: "easeOut" });
      controls.then(() => setDone(true));
    }

    function tick() {
      const current = progress.get();
      if (current < TRICKLE_CAP) {
        progress.set(current + (TRICKLE_CAP - current) * 0.028);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish);
    }
    const safety = window.setTimeout(finish, SAFETY_TIMEOUT_MS);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", finish);
      window.clearTimeout(safety);
    };
  }, [progress]);

  return { progress, done };
}

export default function IntroReveal() {
  // Starts visible unconditionally — same on server and client, so there's
  // no hydration mismatch — and the effect below is what cuts it short for
  // returning visitors within the same session.
  const [visible, setVisible] = useState(true);
  const [skip, setSkip] = useState(false);
  const { progress, done } = useLoadProgress();
  const exitedRef = useRef(false);

  // The cube ring's floating animation drives real px transforms through
  // framer-motion's x/y shorthand, which SSR-serializes at lower precision
  // than the client's first computed frame — a guaranteed hydration mismatch
  // if rendered unconditionally. Mounting it only after hydration (like
  // `skip` below) means the shared server/client render has no cube markup
  // to disagree about in the first place.
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-hydration mount flag plus a one-time read of a client-only API (matchMedia), neither derivable during render.
    setMounted(true);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (hasSeenIntro()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount read of a client-only API (sessionStorage), not derivable during render.
      setSkip(true);
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (skip || exitedRef.current || !done) return;
    exitedRef.current = true;
    // Read matchMedia directly here instead of relying on the `reducedMotion`
    // state above — that state updates in its own separate effect, and if
    // this effect ran first (both fire on the same mount), it would still
    // see the stale `false` and lock in the long hold via `exitedRef`.
    // Reduced motion skips the whole convergence/wordmark sequence (it plays
    // at duration:0 in IsometricLoader), so there's nothing to wait out here
    // either — hold just long enough to not feel like a flicker.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(
      () => {
        markIntroSeen();
        setVisible(false);
      },
      reduced ? 200 : HOLD_AFTER_COMPLETE_MS,
    );
    return () => clearTimeout(timer);
  }, [done, skip]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  const glowOpacity = useTransform(progress, [0, 1], [0.15, 0.55]);

  return (
    <AnimatePresence>
      {visible && !skip && (
        <motion.div
          aria-hidden="true"
          className="fixed inset-0 z-[1000] isolate flex items-center justify-center overflow-hidden bg-[var(--background)]"
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          onClick={() => {
            if (exitedRef.current) return;
            exitedRef.current = true;
            markIntroSeen();
            setVisible(false);
          }}
        >
          <motion.div
            className="liquid-blob absolute left-1/2 top-1/2 h-[52vmax] w-[52vmax] -translate-x-1/2 -translate-y-1/2"
            style={{
              opacity: glowOpacity,
              background:
                "radial-gradient(circle at 45% 40%, var(--aurora-highlight) 0%, var(--aurora-mid) 32%, var(--accent) 62%, var(--aurora-deep) 100%)",
            }}
          />

          {mounted && <IsometricLoader done={done} reducedMotion={reducedMotion} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
