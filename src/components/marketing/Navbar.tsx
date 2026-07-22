"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "#agentes", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  // The impact hero underneath is permanently dark regardless of the
  // site's own light/dark toggle, so the translucent `bg-[var(--background)]`
  // header — designed to blend with whatever theme is active — turned into
  // a washed-out gray bar over it (light color, blurred over a dark
  // backdrop). Starts true to match what SSR would show at scroll 0.
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    function onScroll() {
      setAtTop(window.scrollY < 64);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = links
      .map((link) => document.querySelector(link.href))
      .filter((el): el is Element => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
          atTop
            ? "border-transparent bg-transparent"
            : "border-[var(--hairline)] bg-[var(--background)]/70 backdrop-blur-md",
        )}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span
              className={cn(
                "text-lg font-semibold tracking-[0.2em] transition-colors",
                atTop ? "text-white" : "text-zinc-950 dark:text-white",
              )}
            >
              PRAEKO
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-accent after:transition-all after:duration-300",
                  active === link.href ? "font-medium after:w-full" : "after:w-0",
                  atTop
                    ? active === link.href
                      ? "text-white"
                      : "text-zinc-300 hover:text-white"
                    : active === link.href
                      ? "text-zinc-950 dark:text-white"
                      : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white",
                )}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle
              className={
                atTop
                  ? "flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-zinc-300 transition-colors hover:bg-white/10"
                  : undefined
              }
            />
            <Link
              href="/login"
              className={cn(
                "text-sm font-medium transition-colors",
                atTop ? "text-zinc-300 hover:text-white" : "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white",
              )}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className={cn(
                "btn-shine rounded-full px-4 py-2 text-sm font-medium shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] transition-all hover:scale-[1.03] hover:shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_0_0_3px_rgba(30,107,76,0.18)]",
                atTop ? "bg-white text-zinc-950" : "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950",
              )}
            >
              Empieza gratis
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle
              className={
                atTop
                  ? "flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-zinc-300 transition-colors hover:bg-white/10"
                  : undefined
              }
            />
            <button
              aria-label="Abrir menú"
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "flex h-11 w-11 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                atTop && !open ? "text-white" : "text-zinc-950 dark:text-white",
              )}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Deliberately a SIBLING of <header>, not nested inside it — header's
          own backdrop-blur establishes a containing block for any `fixed`
          descendant (a CSS quirk: filter/backdrop-filter/transform all do
          this), which silently shrank this overlay to the header's own
          content box instead of the viewport when it lived inside it. As a
          sibling it positions against the viewport like any other `fixed`
          element, and z-40 vs the header's z-50 still keeps the header bar
          on top so the close button stays reachable. */}
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col gap-1 overflow-y-auto bg-[var(--background)] px-6 pb-8 pt-24 md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {link.label}
            </a>
          ))}
          <div className="my-2 border-t border-[var(--hairline)]" />
          <Link
            href="/login"
            className="rounded-xl px-3 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            onClick={() => setOpen(false)}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            onClick={() => setOpen(false)}
            className="btn-shine mt-2 rounded-full bg-zinc-950 px-4 py-3 text-center text-base font-medium text-white dark:bg-white dark:text-zinc-950"
          >
            Empieza gratis
          </Link>
        </div>
      )}
    </>
  );
}
