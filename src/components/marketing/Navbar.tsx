"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#agentes", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--hairline)] bg-[var(--background)]/70 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-[0.2em] text-zinc-950">
              PRAEKO
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`relative text-sm transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-accent after:transition-all after:duration-300 ${
                  active === link.href
                    ? "font-medium text-zinc-950 after:w-full"
                    : "text-zinc-600 after:w-0 hover:text-zinc-950"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-950"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] transition-all hover:scale-[1.03] hover:shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_0_0_3px_rgba(31,157,117,0.18)]"
            >
              Empieza gratis
            </Link>
          </div>

          <button
            className="md:hidden"
            aria-label="Abrir menú"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
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
              className="rounded-xl px-3 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              {link.label}
            </a>
          ))}
          <div className="my-2 border-t border-[var(--hairline)]" />
          <Link
            href="/login"
            className="rounded-xl px-3 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            onClick={() => setOpen(false)}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-zinc-950 px-4 py-3 text-center text-base font-medium text-white"
          >
            Empieza gratis
          </Link>
        </div>
      )}
    </>
  );
}
