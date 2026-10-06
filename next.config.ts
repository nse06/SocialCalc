import type { NextConfig } from "next";

if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn(
    "\n⚠ NEXT_PUBLIC_SITE_URL is not set — canonical URLs, the sitemap, and social images will point at localhost.\n",
  );
}

const nextConfig: NextConfig = {
  // Fully static site: deploy the `out/` folder to any static host or CDN.
  output: "export",
  reactStrictMode: true,
};

export default nextConfig;
