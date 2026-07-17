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
          backgroundColor: "#0a0a0c",
          backgroundImage:
            "radial-gradient(circle at 30% 20%, #3a3b42 0%, #0a0a0c 45%), radial-gradient(circle at 75% 75%, #26272c 0%, #0a0a0c 50%)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 132,
            height: 132,
            borderRadius: 36,
            marginBottom: 40,
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: "linear-gradient(135deg, #ffffff 0%, #c8cad0 45%, #45464c 100%)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ fontSize: 80, fontWeight: 700, color: "#0a0a0c" }}>P</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -2,
            backgroundImage: "linear-gradient(135deg, #ffffff 0%, #c8cad0 50%, #8b8d94 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Praeko
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#a3a3ad", marginTop: 20 }}>
          Marketing con agentes de IA para negocios en México
        </div>
      </div>
    ),
    { ...size },
  );
}
