"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, animate, type MotionValue } from "framer-motion";
import { hasSeenIntro, markIntroSeen } from "@/lib/marketing/intro-session";

const WORD = "PRAEKO";

// Same sapphire sweep as the P logomark (dark navy -> vivid blue -> pale
// highlight), expressed as SVG stops instead of a raster LUT, so the
// wordmark reads as the same material as the brand mark instead of a
// separate flat-color treatment.
function GlassDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-fill`} x1="10%" y1="95%" x2="85%" y2="5%">
        <stop offset="0%" stopColor="#03060f" />
        <stop offset="28%" stopColor="#0c2082" />
        <stop offset="52%" stopColor="#2a5cdb" />
        <stop offset="74%" stopColor="#5f9bef" />
        <stop offset="90%" stopColor="#bfd6fb" />
        <stop offset="100%" stopColor="#ffffff" />
      </linearGradient>
      <linearGradient id={`${id}-sheen`} x1="8%" y1="92%" x2="52%" y2="10%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="55%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/** One letter of the wordmark — a faint ghost silhouette sits underneath
 * permanently (so the full word's shape reads immediately), and a
 * sapphire-glass fill wipes upward through a clip-path as this letter's
 * slice of the overall load-progress value fills, one letter at a time. */
function Letter({ char, index, progress }: { char: string; index: number; progress: MotionValue<number> }) {
  const total = WORD.length;
  const start = index / total;
  const end = (index + 1) / total;
  const fillFrac = useTransform(progress, [start, end], [0, 1], { clamp: true });
  const rectY = useTransform(fillFrac, (f) => `${(1 - f) * 120 - 10}%`);
  const rectHeight = useTransform(fillFrac, (f) => `${f * 120 + 10}%`);
  const id = `letter-${index}`;

  return (
    <svg viewBox="0 0 74 96" style={{ width: "clamp(30px, 8vw, 58px)", height: "auto" }} className="overflow-visible">
      <GlassDefs id={id} />
      <text
        x="37"
        y="72"
        textAnchor="middle"
        fontSize="84"
        className="font-[family-name:var(--font-baloo)]"
        fill="var(--hairline)"
      >
        {char}
      </text>
      <clipPath id={`${id}-clip`}>
        <motion.rect x="-10" width="94" y={rectY} height={rectHeight} />
      </clipPath>
      <g clipPath={`url(#${id}-clip)`}>
        <text
          x="37"
          y="72"
          textAnchor="middle"
          fontSize="84"
          className="font-[family-name:var(--font-baloo)]"
          fill={`url(#${id}-fill)`}
        >
          {char}
        </text>
        <text
          x="37"
          y="72"
          textAnchor="middle"
          fontSize="84"
          className="font-[family-name:var(--font-baloo)]"
          fill={`url(#${id}-sheen)`}
        >
          {char}
        </text>
      </g>
    </svg>
  );
}

const SAFETY_TIMEOUT_MS = 7000;
const HOLD_AFTER_COMPLETE_MS = 450;
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
    const timer = setTimeout(() => {
      markIntroSeen();
      setVisible(false);
    }, HOLD_AFTER_COMPLETE_MS);
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

          <div className="relative flex items-end">
            {WORD.split("").map((char, i) => (
              <Letter key={i} char={char} index={i} progress={progress} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
