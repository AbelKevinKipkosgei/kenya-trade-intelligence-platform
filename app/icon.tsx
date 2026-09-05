import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div style={{ flex: 1, backgroundColor: "#000000" }} />
        <div style={{ flex: 1, backgroundColor: "#bb0000" }} />
        <div style={{ flex: 1, backgroundColor: "#006600" }} />
      </div>
    ),
    { ...size },
  );
}
