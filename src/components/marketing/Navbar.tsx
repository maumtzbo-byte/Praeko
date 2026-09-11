"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { FramesMark } from "@/components/brand/FramesMark";
import { cn } from "@/lib/utils";

const links = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#agentes", label: "Agentes" },
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
      {/* A floating capsule, not an edge-to-edge bar — the pill itself is
          always opaque (white/dark-zinc), so it carries its own contrast
          against whatever's behind it (photo, gradient, page background)
          instead of needing scroll-position-driven color branching. */}
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <nav className="flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border border-[var(--hairline)] bg-white/90 px-5 py-2.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2">
            <FramesMark className="h-5 w-5 text-zinc-950" />
            <span className="text-base font-semibold tracking-[0.2em] text-zinc-950">FRAMES</span>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent">
              BETA
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-accent after:transition-all after:duration-300",
                  active === link.href ? "font-medium after:w-full text-zinc-950" : "after:w-0 text-zinc-600 hover:text-zinc-950 ",
                )}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-950 "
            >
              Iniciar sesión
            </Link>
            <Link
              href="/prueba"
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 "
            >
              Ver mis 3 piezas
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              aria-label="Abrir menú"
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 flex flex-col gap-1 overflow-y-auto bg-[var(--background)] px-6 pb-8 pt-24 md:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 "
            >
              {link.label}
            </a>
          ))}
          <div className="my-2 border-t border-[var(--hairline)]" />
          <Link
            href="/login"
            className="rounded-xl px-3 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 "
            onClick={() => setOpen(false)}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/prueba"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-zinc-950 px-4 py-3 text-center text-base font-medium text-white transition-opacity hover:opacity-90 "
          >
            Ver mis 3 piezas
          </Link>
        </div>
      )}
    </>
  );
}
