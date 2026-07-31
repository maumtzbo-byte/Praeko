"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, animate, type MotionValue } from "framer-motion";
import { FramesMark } from "@/components/brand/FramesMark";
import { hasSeenIntro, markIntroSeen } from "@/lib/marketing/intro-session";

// One word per beat while the page loads — verbs from the product's own
// value prop (design, create, publish, automate, inspire), not generic
// loading copy, so the wait itself reads as "Frames" rather than a stock
// spinner.
const LOOP_WORDS = ["Diseña", "Crea", "Publica", "Automatiza", "Inspira"];
const WORD_INTERVAL_MS = 1100;

/** The word cycling through the center of the loader and the 000→100
 * counter pinned to the bottom-right corner, both driven by the same real
 * `progress`/`done` signals as the rest of the loader — the word list loops
 * on its own clock (there's no natural "60% done" mapping for a word the
 * way there is for a percentage) while the counter tracks actual load
 * progress, and both fade out together the moment loading actually
 * finishes, clearing the stage for the mark. */
function LoaderStage({
  progress,
  done,
  reducedMotion,
}: {
  progress: MotionValue<number>;
  done: boolean;
  reducedMotion: boolean;
}) {
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    const unsubscribe = progress.on("change", (v) => setPercent(Math.round(v * 100)));
    return unsubscribe;
  }, [progress]);

  const [wordIndex, setWordIndex] = useState(0);
  useEffect(() => {
    if (done || reducedMotion) return;
    const id = setInterval(() => setWordIndex((i) => (i + 1) % LOOP_WORDS.length), WORD_INTERVAL_MS);
    return () => clearInterval(id);
  }, [done, reducedMotion]);

  return (
    <div className="relative h-full w-full">
      <span className="absolute left-6 top-6 text-[11px] font-medium uppercase tracking-[0.3em] text-white/40 sm:left-10 sm:top-10">
        Marketing con IA
      </span>

      <motion.span
        className="absolute bottom-6 right-6 font-semibold tabular-nums tracking-tight text-white sm:bottom-10 sm:right-10"
        style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
        initial={false}
        animate={{ opacity: done ? 0 : 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.3 }}
      >
        {String(percent).padStart(3, "0")}
      </motion.span>

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div initial={false} animate={{ opacity: done ? 0 : 1 }} transition={{ duration: reducedMotion ? 0 : 0.3 }}>
          <AnimatePresence mode="wait">
            {!done && (
              <motion.span
                key={wordIndex}
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: reducedMotion ? 0 : 0.35, ease: "easeOut" }}
                className="block text-4xl font-medium italic tracking-tight text-white sm:text-5xl"
              >
                {LOOP_WORDS[wordIndex]}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="absolute flex flex-col items-center gap-4"
          initial={false}
          animate={done ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
          transition={
            reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 22, delay: done ? 0.15 : 0 }
          }
        >
          <FramesMark className="h-16 w-16 text-white sm:h-20 sm:w-20" />
          <span className="text-lg font-semibold tracking-[0.35em] text-white">FRAMES</span>
        </motion.div>
      </div>
    </div>
  );
}

const SAFETY_TIMEOUT_MS = 7000;
// Long enough for the word/counter fade-out plus the mark's spring-in to
// actually finish playing (lands around ~750ms after `done`) before the
// exit animation cuts it off.
const HOLD_AFTER_COMPLETE_MS = 1100;
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

  // Mounting the stage only after hydration keeps the shared server/client
  // render free of anything that reads client-only APIs (matchMedia) or
  // ticks on its own (the interval-driven word cycle), so there's nothing
  // for hydration to disagree about.
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

  return (
    <AnimatePresence>
      {visible && !skip && (
        <motion.div
          aria-hidden="true"
          className="fixed inset-0 z-[1000] isolate overflow-hidden bg-[#0a0a0b]"
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          onClick={() => {
            if (exitedRef.current) return;
            exitedRef.current = true;
            markIntroSeen();
            setVisible(false);
          }}
        >
          {mounted && <LoaderStage progress={progress} done={done} reducedMotion={reducedMotion} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
