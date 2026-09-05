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
          flexDirection: "column",
          borderRadius: 36,
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 5, backgroundColor: "#000000" }} />
        <div style={{ flex: 1, backgroundColor: "#ffffff" }} />
        <div style={{ flex: 5, backgroundColor: "#bb0000" }} />
        <div style={{ flex: 1, backgroundColor: "#ffffff" }} />
        <div style={{ flex: 5, backgroundColor: "#006600" }} />
      </div>
    ),
    { ...size },
  );
}
