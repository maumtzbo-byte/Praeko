"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Same silver-chrome gradients as LiquidMetalBackground, just staged as a
// one-time entrance instead of an idle loop, echoing the reference clip's
// liquid blob wiping in to reveal the page — but in Praeko's metal instead
// of a flat brand color.
const BLOBS = [
  {
    gradient: "radial-gradient(circle at 35% 30%, #ffffff 0%, #d6d8dd 30%, #8a8c93 55%, #55565c 70%, #3d3e44 100%)",
    size: "62vmax",
    top: "50%",
    left: "50%",
    delay: 0,
  },
  {
    gradient: "radial-gradient(circle at 60% 40%, #ffffff 0%, #cfd1d6 35%, #75767d 65%, #2c2d31 100%)",
    size: "46vmax",
    top: "42%",
    left: "58%",
    delay: 0.08,
  },
  {
    gradient: "radial-gradient(circle at 40% 60%, #ffffff 0%, #d3d5da 35%, #6d6e75 70%, #232427 100%)",
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
  // either instantly (reduced motion) or after the intro plays out.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setVisible(false), reducedMotion ? 0 : INTRO_DURATION_MS);
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
          transition={{ duration: 0.55, ease: "easeInOut" }}
          onClick={() => setVisible(false)}
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
