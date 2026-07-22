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
        {/* Same aurora blobs as the rest of the site (AuroraBackground,
            IntroReveal) — real color, not the old silver-chrome gradient,
            so a shared link actually looks like the current brand. */}
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -180,
            width: 620,
            height: 620,
            display: "flex",
            borderRadius: "38% 62% 55% 45% / 45% 40% 60% 55%",
            backgroundImage:
              "radial-gradient(circle at 35% 30%, #ece3d8 0%, #c9b896 30%, #1e6b4c 60%, #04140d 100%)",
            opacity: 0.55,
            filter: "blur(10px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -260,
            left: -200,
            width: 680,
            height: 680,
            display: "flex",
            borderRadius: "55% 45% 40% 60% / 60% 55% 45% 40%",
            backgroundImage:
              "radial-gradient(circle at 60% 40%, #ece3d8 0%, #ddd0b8 30%, #1e6b4c 60%, #04140d 100%)",
            opacity: 0.5,
            filter: "blur(10px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(circle at 22% 15%, rgba(244,244,246,0) 0%, #f4f4f6 60%), radial-gradient(circle at 82% 88%, rgba(244,244,246,0) 0%, #f4f4f6 60%)",
          }}
        />

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
          <img src={logoDataUrl} alt="Praeko" width={220} height={220} style={{ display: "flex", objectFit: "cover" }} />
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
