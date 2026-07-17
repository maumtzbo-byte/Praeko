import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg, #ffffff 0%, #c8cad0 45%, #8b8d94 75%, #45464c 100%)",
        }}
      >
        <span style={{ fontSize: 110, fontWeight: 700, color: "#16161a" }}>P</span>
      </div>
    ),
    { ...size },
  );
}
