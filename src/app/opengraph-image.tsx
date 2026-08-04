import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoDataUrl = `data:image/png;base64,${readFileSync(join(process.cwd(), "public/brand/p-logo.png")).toString("base64")}`;

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
          backgroundColor: "#f4f4f6",
        }}
      >
        {/* One deliberate corner glow instead of two overlapping blur-blobs
            — that twin-blob-on-light-background look is the same "generic
            AI SaaS" background almost everyone in the space is using right
            now, not something specific to Frames. A thin rule-of-thirds
            grid ties this back to the actual product (composing a shot)
            without touching the logo mark itself. */}
        <div
          style={{
            position: "absolute",
            top: -260,
            right: -220,
            width: 760,
            height: 760,
            display: "flex",
            borderRadius: "50%",
            backgroundImage: "radial-gradient(circle, #7fb1dd 0%, #3d75ad 45%, rgba(63,117,173,0) 72%)",
            opacity: 0.5,
            filter: "blur(6px)",
          }}
        />
        {/* Faint grid lines, two verticals and two horizontals — a
            composition-grid reference, kept subtle enough to read as
            texture rather than a graphic element competing with the logo. */}
        {[1 / 3, 2 / 3].map((frac) => (
          <div
            key={`v-${frac}`}
            style={{ position: "absolute", top: 0, bottom: 0, left: 1200 * frac, width: 1, display: "flex", backgroundColor: "rgba(24,24,27,0.06)" }}
          />
        ))}
        {[1 / 3, 2 / 3].map((frac) => (
          <div
            key={`h-${frac}`}
            style={{ position: "absolute", left: 0, right: 0, top: 630 * frac, height: 1, display: "flex", backgroundColor: "rgba(24,24,27,0.06)" }}
          />
        ))}

        {/* content */}
        <div
          style={{
            display: "flex",
            width: 220,
            height: 220,
            borderRadius: 44,
            overflow: "hidden",
            boxShadow: "0 30px 60px rgba(22,22,26,0.2)",
          }}
        >
          <img src={logoDataUrl} alt="Frames" width={220} height={220} style={{ display: "flex", objectFit: "cover" }} />
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 44,
            gap: 22,
          }}
        >
          <span style={{ display: "flex", fontSize: 46, fontWeight: 700, letterSpacing: -1, color: "#18181b" }}>
            Agentes de IA para tu marketing
          </span>
          <span style={{ fontSize: 22, color: "#52525b" }}>
            Videos, imágenes y publicaciones, todos los días — sin que grabes nada.
          </span>
          <div
            style={{
              display: "flex",
              padding: "10px 26px",
              borderRadius: 999,
              border: "1px solid rgba(63,63,70,0.3)",
              backgroundColor: "rgba(255,255,255,0.6)",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: 4, color: "#3f3f46" }}>
              MARKETING CON INTELIGENCIA
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
