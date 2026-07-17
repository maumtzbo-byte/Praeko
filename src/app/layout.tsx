import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
