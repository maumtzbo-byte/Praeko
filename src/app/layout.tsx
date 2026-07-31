import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Geist is the only typeface on the site — headline hierarchy comes from
// weight/size/tracking, not a separate display family (a Fraunces italic
// serif + Baloo wordmark font used to carry that job; both are gone now).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://praekomarketingsaas.vercel.app";
const SITE_TITLE = "Frames — Marketing con Inteligencia";
const SITE_DESCRIPTION =
  "Videos, imágenes y publicaciones para tus redes sociales, creados y publicados por IA todos los días — sin que grabes, edites ni programes nada. Hecho para negocios pequeños en México.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — Frames",
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
    siteName: "Frames",
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
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {/* Barely-visible grain — same trick Stripe/Linear use so flat color
            fields read as material instead of a solid CSS fill. Overlay
            (not multiply) so it still shows up on a dark background —
            multiply only ever darkens, which makes noise invisible against
            near-black. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[999] opacity-[0.025] mix-blend-overlay"
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
