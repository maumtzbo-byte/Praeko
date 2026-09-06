"use client";

import Link from "next/link";
import { Play, Heart, MessageCircle, Send } from "lucide-react";

export default function Hero() {
  return (
    <section
      className="relative flex min-h-[92vh] flex-col items-center overflow-hidden pb-16 pt-36 sm:min-h-[100vh] sm:pb-20 sm:pt-40 md:pb-24"
      style={{
        background: "linear-gradient(180deg, #cfe6f8 0%, #7fb1dd 26%, #3d75ad 50%, #cfe0ef 82%, var(--background) 100%)",
      }}
    >
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-zinc-950/70 py-1.5 pl-1.5 pr-3.5 text-xs font-medium text-white backdrop-blur-sm">
          <span className="rounded-full bg-white/25 px-2 py-1 text-[10px] font-semibold">BETA</span>
          Agentes de IA para negocios en México
        </span>

        {/* Una sola afirmación fija en vez de una palabra que rota: el
            gancho más fuerte que tiene el producto es contra qué se compara
            (contratar a alguien), y eso se dice mejor de corrido que
            repartido en cinco variantes que se van turnando. */}
        <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
          Todo tu equipo de marketing. Sin contratar a nadie.
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-white/90 sm:text-xl">
          Siete agentes de IA planean, producen y publican el contenido de tu negocio. Tú solo apruebas.
        </p>

        {/* Always side by side, even on narrow phones — stacking these
            wasted vertical space and read as an afterthought rather than
            one deliberate CTA pair. */}
        <div className="mt-8 flex flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/registro"
            className="rounded-full bg-white px-5 py-3 text-sm font-medium tracking-tight text-zinc-950 transition-opacity hover:opacity-90 sm:px-7 sm:py-3.5 sm:text-[15px]"
          >
            Únete a la beta
          </Link>
          <a
            href="#como-funciona"
            className="rounded-full bg-zinc-950/30 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-zinc-950/45 sm:px-7 sm:py-3.5 sm:text-[15px]"
          >
            Cómo funciona
          </a>
        </div>
        {/* Removes the "is this going to charge me" hesitation right where
            it would otherwise stall someone on the fence — true today: the
            signup form only asks for email and password, no payment step. */}
        <p className="mt-4 text-xs text-white/70">Sin tarjeta de crédito requerida</p>
      </div>

      {/* Phone mockup overlapping the seam between the hero and the page
          below — the actual output (a published Reel), not another
          screenshot of the tool, doing the same "wow" job the
          reference's phone-over-photo composition does. */}
      <div className="relative z-10 mt-12 w-40 shrink-0 sm:w-48 md:w-56">
        <div
          className="relative overflow-hidden rounded-[2rem] border-[6px] border-zinc-900 bg-zinc-900 shadow-[0_40px_90px_-25px_rgba(0,0,0,0.45)] md:rounded-[2.5rem] md:border-[8px]"
          style={{ aspectRatio: "9 / 19.5" }}
        >
          {/* Layered gradients instead of one flat wash — a single flat
              color inside the frame read as an empty/unfinished screen
              rather than an actual video frame. */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent-strong via-zinc-900 to-zinc-950" />
          <div
            className="absolute inset-0 opacity-70"
            style={{ background: "radial-gradient(ellipse 90% 60% at 30% 20%, rgba(95,146,196,0.55) 0%, transparent 60%)" }}
          />
          <div
            className="absolute inset-0 opacity-50"
            style={{ background: "radial-gradient(ellipse 70% 50% at 80% 85%, rgba(31,62,92,0.7) 0%, transparent 65%)" }}
          />

          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1.5 h-3 w-12 -translate-x-1/2 rounded-full bg-black/40 md:top-2 md:h-4 md:w-16"
          />

          {/* A playback progress bar — the one detail every real Reel/
              Story has near the top — is what separates "photo of a
              phone with an icon on it" from "screenshot of an app". */}
          <div className="absolute inset-x-2.5 top-5 flex gap-1 md:inset-x-3 md:top-6">
            <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <span className="block h-full w-2/3 rounded-full bg-white" />
            </span>
            <span className="h-[3px] flex-1 rounded-full bg-white/25" />
            <span className="h-[3px] flex-1 rounded-full bg-white/25" />
          </div>

          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm md:h-12 md:w-12">
              <Play className="h-3.5 w-3.5 fill-white text-white md:h-5 md:w-5" />
            </span>
          </span>

          <div className="absolute bottom-14 right-1.5 flex flex-col items-center gap-2.5 text-white md:bottom-20 md:right-3 md:gap-4">
            <Heart className="h-3.5 w-3.5 fill-white md:h-5 md:w-5" />
            <MessageCircle className="h-3.5 w-3.5 fill-white md:h-5 md:w-5" />
            <Send className="h-3.5 w-3.5 fill-white md:h-5 md:w-5" />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2.5 pt-6 md:px-4 md:pb-4">
            <p className="text-[8px] font-semibold text-white md:text-xs">@tunegocio</p>
            <p className="mt-0.5 text-[7px] leading-tight text-white/80 md:text-[10px]">Nuevo: Frappé de temporada 🧊</p>
          </div>
        </div>
      </div>
    </section>
  );
}
