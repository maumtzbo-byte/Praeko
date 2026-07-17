import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          backgroundImage:
            "radial-gradient(circle at 18% 12%, #ffffff 0%, #e4e4e8 40%, #f4f4f6 70%), radial-gradient(circle at 88% 90%, #ffffff 0%, #dcdce1 45%, #f4f4f6 75%)",
        }}
      >
        {/* liquid-metal blobs, corners */}
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -180,
            width: 620,
            height: 620,
            display: "flex",
            borderRadius: "38% 62% 55% 45% / 45% 40% 60% 55%",
            backgroundImage: "linear-gradient(135deg, #ffffff 0%, #d4d5da 35%, #9a9ca3 65%, #f4f4f6 100%)",
            opacity: 0.85,
            transform: "rotate(18deg)",
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
            backgroundImage: "linear-gradient(315deg, #ffffff 0%, #c8cad0 30%, #8b8d94 60%, #f4f4f6 100%)",
            opacity: 0.8,
            transform: "rotate(-12deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(circle at 22% 15%, rgba(244,244,246,0) 0%, #f4f4f6 55%), radial-gradient(circle at 82% 88%, rgba(244,244,246,0) 0%, #f4f4f6 55%)",
          }}
        />

        {/* content */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 90 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: "#3f3f46" }}>CREAMOS</span>
            <span style={{ fontSize: 20, color: "#71717a", marginTop: 6 }}>contenido que conecta.</span>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              width: 210,
              height: 210,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "42% 58% 63% 37% / 48% 42% 58% 52%",
              backgroundImage:
                "linear-gradient(150deg, #ffffff 0%, #ffffff 12%, #c8cad0 42%, #8b8d94 68%, #45464c 92%)",
              boxShadow: "0 35px 80px rgba(22,22,26,0.22), inset 0 -14px 30px rgba(22,22,26,0.25)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 24,
                left: 30,
                width: 90,
                height: 60,
                display: "flex",
                borderRadius: "50%",
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 70%)",
              }}
            />
            <span
              style={{
                display: "flex",
                fontSize: 118,
                fontWeight: 700,
                backgroundImage: "linear-gradient(180deg, #ffffff 0%, #e4e4e8 35%, #45464c 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              P
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: "#3f3f46" }}>IMPULSAMOS</span>
            <span style={{ fontSize: 20, color: "#71717a", marginTop: 6 }}>marcas que impactan.</span>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 56,
            gap: 20,
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 500, letterSpacing: 8, color: "#52525b" }}>
            ESTRATEGIA · CONTENIDO · RESULTADOS
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
