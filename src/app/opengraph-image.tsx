import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f4f4f6",
          backgroundImage:
            "radial-gradient(circle at 18% 12%, #ffffff 0%, #e4e4e8 40%, #f4f4f6 70%), radial-gradient(circle at 88% 90%, #ffffff 0%, #dcdce1 45%, #f4f4f6 75%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 90 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: "#3f3f46" }}>CREAMOS</span>
            <span style={{ fontSize: 20, color: "#71717a", marginTop: 6 }}>contenido que conecta.</span>
          </div>

          <div
            style={{
              display: "flex",
              width: 190,
              height: 190,
              borderRadius: 56,
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "linear-gradient(135deg, #ffffff 0%, #c8cad0 45%, #8b8d94 75%, #45464c 100%)",
              boxShadow: "0 30px 70px rgba(0,0,0,0.18)",
            }}
          >
            <span style={{ fontSize: 110, fontWeight: 700, color: "#16161a" }}>P</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 6, color: "#3f3f46" }}>IMPULSAMOS</span>
            <span style={{ fontSize: 20, color: "#71717a", marginTop: 6 }}>marcas que impactan.</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 56, gap: 20 }}>
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
