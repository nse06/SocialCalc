import type { MetadataRoute } from "next";
import { LANDING_PAGES } from "@/lib/content/landing-pages";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/calculator"), changeFrequency: "monthly", priority: 0.9 },
    ...LANDING_PAGES.map((page) => ({
      url: absoluteUrl(`/${page.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/methodology"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
