import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Frames — Marketing con Inteligencia",
    short_name: "Frames",
    description: "SaaS de marketing con agentes de IA para negocios pequeños en México.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f6",
    theme_color: "#16161a",
    icons: [
      { src: "/icon.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
