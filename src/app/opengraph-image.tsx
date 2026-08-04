import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Same two paths as FramesMark.tsx, inlined rather than imported — next/og's
// renderer works off a constrained JSX subset (satori), not real React, so
// components from the app can't be reused directly. Path data copied
// verbatim; if the mark ever changes, copy it here too.
const MARK_PATHS = [
  "M82,50 L82,72 A10,10 0 0 1 72,82 L28,82 A10,10 0 0 1 18,72 L18,61",
  "M18,50 L18,28 A10,10 0 0 1 28,18 L72,18 A10,10 0 0 1 82,28 L82,39",
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundColor: "#0a0a0b",
        }}
      >
        {/* Full-bleed dark, not a pale card on a light field — the same
            treatment apple-icon.png and the video showcase section already
            use, so a shared link looks like it came from the same place as
            everything else. One soft diagonal glow for depth, not a blob
            competing for attention. */}
        <div
          style={{
            position: "absolute",
            bottom: -320,
            right: -260,
            width: 900,
            height: 900,
            display: "flex",
            borderRadius: "50%",
            backgroundImage: "radial-gradient(circle, rgba(95,146,196,0.55) 0%, rgba(63,117,173,0.28) 45%, rgba(10,10,11,0) 72%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -260,
            left: -220,
            width: 620,
            height: 620,
            display: "flex",
            borderRadius: "50%",
            backgroundImage: "radial-gradient(circle, rgba(31,62,92,0.5) 0%, rgba(10,10,11,0) 70%)",
          }}
        />
        {/* Faint grid lines, two verticals and two horizontals — a
            composition-grid reference (this is a product about framing a
            shot), kept subtle enough to read as texture. */}
        {[1 / 3, 2 / 3].map((frac) => (
          <div
            key={`v-${frac}`}
            style={{ position: "absolute", top: 0, bottom: 0, left: 1200 * frac, width: 1, display: "flex", backgroundColor: "rgba(255,255,255,0.06)" }}
          />
        ))}
        {[1 / 3, 2 / 3].map((frac) => (
          <div
            key={`h-${frac}`}
            style={{ position: "absolute", left: 0, right: 0, top: 630 * frac, height: 1, display: "flex", backgroundColor: "rgba(255,255,255,0.06)" }}
          />
        ))}

        {/* content */}
        <svg width="108" height="108" viewBox="0 0 100 100" fill="none" style={{ display: "flex", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.35))" }}>
          {MARK_PATHS.map((d) => (
            <path key={d} d={d} stroke="white" strokeWidth="7" strokeLinecap="butt" strokeLinejoin="round" />
          ))}
        </svg>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 40,
            gap: 22,
          }}
        >
          <span style={{ display: "flex", fontSize: 48, fontWeight: 700, letterSpacing: -1, color: "#ffffff" }}>
            Agentes de IA para tu marketing
          </span>
          <span style={{ fontSize: 22, color: "#a1a1aa" }}>
            Videos, imágenes y publicaciones, todos los días — sin que grabes nada.
          </span>
          <div
            style={{
              display: "flex",
              padding: "10px 26px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.18)",
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: 4, color: "#e4e4e7" }}>
              MARKETING CON INTELIGENCIA
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
