/** Site-wide identity. Set NEXT_PUBLIC_SITE_URL in production for canonical URLs and the sitemap. */
export const SITE = {
  name: "How Much Should I Charge?",
  shortName: "How Much Should I Charge",
  tagline: "Stop guessing what your content is worth.",
  description:
    "Free brand deal calculator for creators. Get a fair starting price for your next sponsored post, Reel, TikTok, YouTube integration, or UGC deal — plus a quote you can send.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, ""),
  /** Shown on the privacy and terms pages. Platform API reviews (e.g. YouTube's) expect a contact. */
  contactEmail: /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "")
    ? (process.env.NEXT_PUBLIC_CONTACT_EMAIL as string)
    : null,
} as const;

export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
