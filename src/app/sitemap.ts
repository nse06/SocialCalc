import type { MetadataRoute } from "next";
import { GUIDES, LANDING_PAGES } from "@/lib/content/landing-pages";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/** Bump when page content meaningfully changes. */
const CONTENT_UPDATED = new Date("2026-10-06");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = CONTENT_UPDATED;
  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/calculator"), lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/calculators"), lastModified, changeFrequency: "monthly", priority: 0.8 },
    ...LANDING_PAGES.map((page) => ({
      url: absoluteUrl(`/${page.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...GUIDES.map((guide) => ({
      url: absoluteUrl(`/${guide.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: absoluteUrl("/methodology"), lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/terms"), lastModified, changeFrequency: "yearly", priority: 0.2 },
  ];
}
