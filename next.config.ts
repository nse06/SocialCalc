import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site: deploy the `out/` folder to any static host or CDN.
  output: "export",
  reactStrictMode: true,
};

export default nextConfig;
