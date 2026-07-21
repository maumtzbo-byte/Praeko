"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "praeko-theme";

/** Mirrors the inline script in layout.tsx that sets `.dark` before first
 * paint — this only reads that already-applied class post-mount instead of
 * deciding the theme itself, so there's one single source of truth for
 * "what theme is active" instead of two independent guesses that could
 * disagree. */
function getIsDark() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle({ className }: { className?: string }) {
  // Starts false on both server and client — matches what the server would
  // render — and syncs to the real value in an effect once `document` is
  // available, same pattern used elsewhere for client-only reads.
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount read of the class the no-FOUC script already applied to <html>.
    setIsDark(getIsDark());
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={
        className ??
        "flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300/80 text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }
      // Avoids a one-frame icon flip between the server-rendered "light"
      // icon and the real theme once the effect above runs.
      style={{ visibility: mounted ? "visible" : "hidden" }}
    >
      {isDark ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
    </button>
  );
}
