import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "How much should you charge for a brand deal? Free rate calculator for creators.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontDir = join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");

export default async function OpenGraphImage() {
  const [semibold, regular] = await Promise.all([
    readFile(join(fontDir, "Geist-SemiBold.ttf")),
    readFile(join(fontDir, "Geist-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "radial-gradient(900px 520px at 85% 0%, rgba(124,92,255,0.55), rgba(15,14,23,0) 70%), #0f0e17",
          color: "white",
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#ffffff",
              color: "#0f0e17",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 600,
            }}
          >
            $
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5, display: "flex" }}>
            How Much Should I&nbsp;<span style={{ color: "#b9a8ff" }}>Charge?</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -3, lineHeight: 1.04, maxWidth: 940 }}>
            How much should you charge for a brand deal?
          </div>
          <div style={{ marginTop: 26, fontSize: 30, color: "#c9c6dc", fontWeight: 400 }}>
            A fair starting price for Reels, TikToks, YouTube, and UGC — plus a quote you can send.
          </div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {["Free", "No sign-up", "Transparent breakdown", "Copy-ready quote"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.18)",
                fontSize: 22,
                color: "#e4e2f3",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: semibold, weight: 600, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
