import type { NextConfig } from "next";

// Baseline security headers on every response. No Content-Security-Policy
// here on purpose — Frames pulls in Framer Motion, three.js/@react-three,
// Supabase, and OAuth redirects (Google/Meta/TikTok) from several origins,
// and a CSP written without live-testing every one of those paths is more
// likely to silently break the site than protect it. These five are safe
// defaults that don't depend on knowing every script/connect origin.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
