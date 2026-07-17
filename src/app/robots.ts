import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/onboarding", "/auth"],
      },
    ],
    sitemap: "https://praekomarketingsaas.vercel.app/sitemap.xml",
  };
}
