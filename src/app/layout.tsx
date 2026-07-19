import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial serif used only for a handful of large marketing headlines
// (CtaSection, PricingSection, SocialProof) — Geist stays the body/UI font
// everywhere else, including the whole dashboard.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["italic", "normal"],
});

const SITE_URL = "https://praekomarketingsaas.vercel.app";
const SITE_TITLE = "Praeko — Marketing con Inteligencia";
const SITE_DESCRIPTION =
  "Praeko es el SaaS de marketing con agentes de IA que crea contenido, publica y mide resultados por ti. Estrategia, contenido y resultados en un solo lugar.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — Praeko",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "marketing con IA",
    "agentes de IA",
    "marketing para negocios pequeños",
    "generación de contenido con IA",
    "SaaS de marketing México",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: SITE_URL,
    siteName: "Praeko",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {/* Barely-visible grain — same trick Stripe/Linear use so flat color
            fields read as material instead of a solid CSS fill. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[999] opacity-[0.025] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
