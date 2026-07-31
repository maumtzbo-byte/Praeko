"use client";

import { motion } from "framer-motion";
import { Dumbbell, UtensilsCrossed, Sparkles, ShoppingBag, HeartPulse, Briefcase, type LucideIcon } from "lucide-react";

// Same industry taxonomy already used in VideoShowcase/onboarding — real
// verticals Praeko serves.
const INDUSTRIES: { label: string; icon: LucideIcon }[] = [
  { label: "Gimnasio o estudio boutique", icon: Dumbbell },
  { label: "Restaurante o cafetería", icon: UtensilsCrossed },
  { label: "Belleza y estética", icon: Sparkles },
  { label: "Retail o tienda", icon: ShoppingBag },
  { label: "Salud y bienestar", icon: HeartPulse },
  { label: "Servicios profesionales", icon: Briefcase },
];

export default function IndustryScrollGallery() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500 dark:text-zinc-400">PARA QUIÉN ES ESTO</p>
        <h2 className="max-w-md text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          Contenido para cualquier tipo de negocio
        </h2>

        {/* A static grid, no scroll choreography — flat cards with an
            outlined icon mark and the industry name, nothing decorative. */}
        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--hairline)] sm:grid-cols-3">
          {INDUSTRIES.map((industry, i) => {
            const Icon = industry.icon;
            return (
              <motion.div
                key={industry.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
                className="flex flex-col items-start gap-4 bg-[var(--background)] p-6 sm:p-8"
              >
                <Icon aria-hidden="true" className="h-5 w-5 text-accent" strokeWidth={1.5} />
                <p className="text-sm font-medium leading-tight text-zinc-950 dark:text-white">{industry.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
