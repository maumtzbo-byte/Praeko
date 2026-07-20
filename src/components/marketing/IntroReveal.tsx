"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { hasSeenIntro, markIntroSeen } from "@/lib/marketing/intro-session";

// Same aurora borealis gradients as AuroraBackground, just staged as a
// one-time entrance instead of an idle loop, echoing the reference clip's
// liquid blob wiping in to reveal the page — Praeko's own green-teal-violet
// palette instead of a flat brand color or the metallic look this replaced.
const BLOBS = [
  {
    gradient:
      "radial-gradient(circle at 35% 30%, var(--aurora-highlight) 0%, var(--aurora-mid) 28%, var(--accent) 55%, var(--accent-strong) 78%, var(--aurora-deep) 100%)",
    size: "62vmax",
    top: "50%",
    left: "50%",
    delay: 0,
  },
  {
    gradient:
      "radial-gradient(circle at 60% 40%, var(--aurora-highlight) 0%, var(--aurora-mid) 30%, var(--aurora-blue) 58%, var(--aurora-deep) 100%)",
    size: "46vmax",
    top: "42%",
    left: "58%",
    delay: 0.08,
  },
  {
    gradient:
      "radial-gradient(circle at 40% 60%, var(--aurora-highlight) 0%, var(--aurora-mid) 35%, var(--accent-strong) 68%, var(--aurora-deep) 100%)",
    size: "40vmax",
    top: "58%",
    left: "40%",
    delay: 0.14,
  },
];

const INTRO_DURATION_MS = 1500;

export default function IntroReveal() {
  // Starts visible unconditionally — same on server and client, so there's
  // no hydration mismatch — and the effect below is what cuts it short,
  // either instantly (reduced motion / already seen this session) or after
  // the intro plays out.
  const [visible, setVisible] = useState(true);
  // A returning visitor within the same session shouldn't even get the
  // 0.55s dissolve — that's still "sit through a fade for nothing new"
  // repeated on every page. Only a genuine first-time play gets it.
  const [exitDuration, setExitDuration] = useState(0.55);

  useEffect(() => {
    // Only the first visit of a session gets the cinematic entrance —
    // every reload/return after that would just be making a returning
    // visitor sit through the same 1.5s again for nothing new.
    if (hasSeenIntro()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount read of a client-only API (sessionStorage), not derivable during render.
      setExitDuration(0);
      setVisible(false);
      return;
    }
    // Marked as seen only once the intro actually finishes (here, or on
    // skip-click below) — not right away at mount. ScrollStory reads this
    // same flag at its own mount, in the same initial commit as this
    // effect; marking it immediately would make a *genuine* first visit
    // look already-seen to ScrollStory before it ever got to play its own
    // cinematic version.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => {
      markIntroSeen();
      setVisible(false);
    }, reducedMotion ? 0 : INTRO_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

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
      {visible && (
        <motion.div
          aria-hidden="true"
          className="fixed inset-0 z-[1000] isolate flex items-center justify-center overflow-hidden bg-[var(--background)]"
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: exitDuration, ease: "easeInOut" }}
          onClick={() => {
            markIntroSeen();
            setVisible(false);
          }}
        >
          {BLOBS.map((blob, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                width: blob.size,
                height: blob.size,
                top: blob.top,
                left: blob.left,
                translateX: "-50%",
                translateY: "-50%",
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.9, scale: 1 }}
              transition={{ duration: 0.6, delay: blob.delay, ease: "easeOut" }}
            >
              {/* Static entrance (opacity/scale) lives on this wrapper; the
                  perpetual morph (border-radius + its own rotate) lives on
                  .liquid-blob below. Both set `transform`, so on one element
                  the CSS keyframe would silently overwrite the entrance
                  scale every frame — splitting them across parent/child
                  lets both apply at once. */}
              <div
                className="liquid-blob h-full w-full"
                style={{ background: blob.gradient }}
              />
            </motion.div>
          ))}

          <motion.p
            className="relative text-2xl font-semibold tracking-[0.3em] text-zinc-950 sm:text-3xl"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
          >
            PRAEKO
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
