/**
 * SEO landing pages. Each entry becomes a static page at /{slug} with its own
 * copy, a pre-configured calculator, FAQs (with FAQPage structured data), a
 * methodology summary, and internal links.
 *
 * To add a page: add an entry here. Nothing else to wire up — routing, the
 * sitemap, and footer links all read from this list.
 */
import type { DraftPreset } from "@/lib/pricing/draft";

export interface LandingSection {
  heading: string;
  paragraphs?: string[];
  bullets?: { title?: string; text: string }[];
}

export interface Faq {
  q: string;
  a: string;
}

export interface LandingPage {
  slug: string;
  /** Used in nav/footer links. */
  linkLabel: string;
  /** One line for link cards. */
  blurb: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  intro: string;
  preset: DraftPreset;
  sections: LandingSection[];
  /** Render the usage-fee table from the pricing config. */
  usageTable?: "all" | "whitelisting";
  /** Render the exclusivity-fee table from the pricing config. */
  exclusivityTable?: boolean;
  faqs: Faq[];
  related: string[];
}

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "instagram-rate-calculator",
    linkLabel: "Instagram rate calculator",
    blurb: "Price sponsored Reels, posts, carousels, and Stories from your real reach.",
    metaTitle: "Instagram Rate Calculator: What to Charge for Sponsored Posts & Reels",
    metaDescription:
      "Free Instagram rate calculator. Get a fair starting price for sponsored Reels, posts, carousels, and Stories based on your reach, engagement, and the deal terms.",
    eyebrow: "Instagram rate calculator",
    h1: "How much should you charge for an Instagram sponsored post?",
    intro:
      "Get a fair starting price for a sponsored Reel, feed post, carousel, or Story — based on how many people actually see your content, how engaged they are, and what the brand wants to do with it.",
    preset: { platform: "instagram" },
    sections: [
      {
        heading: "What actually drives an Instagram rate",
        paragraphs: [
          "Follower count is the number brands see first, but it isn't what they're paying for. They're paying for attention: how many people a typical post reaches, how much those people engage, and the work that goes into the content.",
          "That's why two accounts with the same follower count can deserve very different rates. This calculator starts from your typical reach, then adjusts for engagement, niche, audience location, production effort, and the terms of the deal.",
        ],
      },
      {
        heading: "Reels, feed posts, carousels, and Stories",
        bullets: [
          { title: "Reels", text: "Usually reach the most people and take the most work, so they start from the highest reach estimate." },
          { title: "Carousels", text: "Good for saves and education; more design work than a single image." },
          { title: "Feed posts", text: "A single image or graphic. Lower effort, typically lower reach than Reels." },
          { title: "Stories", text: "Reach fewer people and disappear after 24 hours, but they're quick to make and great for links." },
        ],
      },
      {
        heading: "Don't give usage rights away",
        paragraphs: [
          "If a brand wants to repost your Reel, run it as an ad, or put it on their website, that's extra value — and it should be extra money. Partnership ads (whitelisting) are where many creators leave the most money on the table.",
        ],
      },
    ],
    faqs: [
      {
        q: "How much should I charge per 1,000 followers on Instagram?",
        a: "You'll hear rules of thumb like “$10 per 1,000 followers.” They're easy to remember but ignore reach, engagement, effort, and usage rights — so two creators with the same follower count can deserve very different rates. This calculator prices from expected reach instead and shows every assumption it uses.",
      },
      {
        q: "Should a Reel cost more than a feed post?",
        a: "Usually, yes. Reels tend to reach more people and take more work to make, so in this calculator a Reel starts from a higher reach estimate and a higher content-creation fee than a single-image post.",
      },
      {
        q: "What if I don't know my average reach or views?",
        a: "Open Insights in Instagram's professional dashboard and look at the reach or plays of your last 10 posts. Use a typical number, not your best one. If you skip it, we estimate from your followers and give you a wider range.",
      },
      {
        q: "How do I calculate my Instagram engagement rate?",
        a: "Add up the likes, comments, saves, and shares on a recent post (or average a few posts), divide by your follower count, and multiply by 100. The calculator can do the math for you.",
      },
      {
        q: "Should I charge for Instagram partnership ads?",
        a: "Yes. Partnership ads let a brand run paid ads through your handle. That's valuable to them and uses your reputation, so price it as a separate fee for a defined period.",
      },
    ],
    related: ["instagram-reel-price-calculator", "instagram-story-price-calculator", "whitelisting-calculator", "usage-rights-calculator"],
  },
  {
    slug: "tiktok-rate-calculator",
    linkLabel: "TikTok rate calculator",
    blurb: "Price sponsored TikToks from your typical views, not your follower count.",
    metaTitle: "TikTok Rate Calculator: What to Charge for Sponsored TikToks",
    metaDescription:
      "Free TikTok rate calculator for creators. Price sponsored TikToks, UGC, and Spark Ads using your typical views, engagement, and the deal terms.",
    eyebrow: "TikTok rate calculator",
    h1: "How much should you charge for a sponsored TikTok?",
    intro:
      "On TikTok, views matter more than followers. Enter your typical views, engagement, and what the brand is asking for — and get a fair starting price plus a quote you can send.",
    preset: { platform: "tiktok" },
    sections: [
      {
        heading: "Why views beat followers on TikTok",
        paragraphs: [
          "The For You feed means a video's reach depends far more on the content than on your follower count. A creator with 8,000 followers whose videos steadily get 20,000 views can be worth more to a brand than one with 100,000 followers whose videos stall at 2,000.",
          "Use your typical recent views — not your one viral hit. Brands will check.",
        ],
      },
      {
        heading: "Sponsored TikTok vs. UGC",
        paragraphs: [
          "A sponsored TikTok is posted on your account, to your audience. UGC is content you make for the brand to post or advertise with — it's priced on the work and the usage rights, not on your followers.",
        ],
      },
      {
        heading: "Spark Ads are a separate fee",
        paragraphs: [
          "Brands often want to boost sponsored TikToks with Spark Ads, which run the ad from your account. That's whitelisting, and it's usually priced as an extra fee based on how long they can run it. The calculator gives it its own line on your quote.",
        ],
      },
    ],
    faqs: [
      {
        q: "How much do TikTok creators charge per 1,000 views?",
        a: "There's no single rate. This calculator uses a planning price per 1,000 expected views for each format, adds a content-creation fee, then adjusts for engagement, niche, audience location, and effort. You can see and question every number on the methodology page.",
      },
      {
        q: "What counts as engagement on TikTok?",
        a: "Likes, comments, shares, and saves. For TikTok we compare them with your views rather than your followers, because that's how reach works on the platform.",
      },
      {
        q: "Should I charge more for Spark Ads?",
        a: "Yes. Spark Ads put paid media behind your post, under your name. Price them as a time-limited whitelisting fee on top of the video itself.",
      },
      {
        q: "Can I charge brands if I have a small following?",
        a: "Yes. Brands are paying for content and attention, not just follower count. With a smaller audience, more of your price reflects the content itself — much like UGC pricing.",
      },
    ],
    related: ["tiktok-sponsorship-calculator", "ugc-rate-calculator", "whitelisting-calculator", "instagram-rate-calculator"],
  },
  {
    slug: "youtube-rate-calculator",
    linkLabel: "YouTube sponsorship calculator",
    blurb: "Price integrations, dedicated videos, and Shorts from your 30-day views.",
    metaTitle: "YouTube Sponsorship Calculator: What to Charge for Integrations",
    metaDescription:
      "Free YouTube sponsorship rate calculator. Estimate fair prices for integrations, dedicated videos, and Shorts from your typical views and the deal terms.",
    eyebrow: "YouTube rate calculator",
    h1: "How much should you charge for a YouTube sponsorship?",
    intro:
      "Price an integration, a dedicated video, or a Short from your typical views — then add what the brand wants on top, like usage rights or exclusivity.",
    preset: { platform: "youtube" },
    sections: [
      {
        heading: "Integrations vs. dedicated videos vs. Shorts",
        bullets: [
          { title: "Integration", text: "A 30–90 second segment inside a video you were making anyway." },
          { title: "Dedicated video", text: "A whole video built around the brand. Far more work, and usually a much higher price." },
          { title: "Short", text: "Priced closer to other short-form video, like Reels and TikToks." },
        ],
      },
      {
        heading: "Use views from the first 30 days",
        paragraphs: [
          "Most YouTube sponsorships are valued on the views a video gets in its first month. Look at your last 10 long-form videos in YouTube Studio and pick a typical 30-day number — not your best.",
        ],
      },
      {
        heading: "Usage and exclusivity on YouTube",
        paragraphs: [
          "If the brand wants to cut your video into ads or post it on their own channels, price usage separately. Category exclusivity — no competing sponsors for a period — costs you future deals, so it should cost them too.",
        ],
      },
    ],
    faqs: [
      {
        q: "How much do YouTubers charge per 1,000 views?",
        a: "It varies widely by niche, audience, and format. This calculator uses separate planning prices for Shorts, integrations, and dedicated videos, plus a creation fee — all listed on the methodology page.",
      },
      {
        q: "Should I price from subscribers or views?",
        a: "Views. Subscribers tell you how many people opted in at some point; views tell you how many will actually see the sponsorship. If you don't know your typical views, we estimate them from subscribers and widen the range.",
      },
      {
        q: "What about views after the first 30 days?",
        a: "Long-tail views are a real bonus for the brand. Mention them in negotiation, or lean toward the top of your range — the calculator conservatively prices the first 30 days.",
      },
      {
        q: "Should finance and tech channels charge more?",
        a: "Usually. Advertisers tend to pay more to reach audiences in categories like finance, B2B, and technology, so those niches start from a higher planning band.",
      },
    ],
    related: ["youtube-shorts-sponsorship-calculator", "brand-deal-calculator", "usage-rights-calculator", "influencer-rate-calculator"],
  },
  {
    slug: "influencer-rate-calculator",
    linkLabel: "Influencer rate calculator",
    blurb: "A transparent starting rate for any platform, with every assumption shown.",
    metaTitle: "Influencer Rate Calculator: What Should You Charge Brands?",
    metaDescription:
      "A free, transparent influencer rate calculator. Get a fair price range for any platform, see exactly what drives it, and copy a ready-to-send quote.",
    eyebrow: "Influencer rate calculator",
    h1: "Influencer rate calculator",
    intro:
      "A transparent way to price sponsored content on Instagram, TikTok, YouTube, X, LinkedIn, Twitch, and more. Answer a few quick questions and see exactly where your number comes from.",
    preset: {},
    sections: [
      {
        heading: "Why follower-count formulas fall short",
        paragraphs: [
          "Formulas like “$100 per 10,000 followers” are easy to quote and easy to get wrong. They ignore how many people actually see your posts, how engaged they are, how much work the content takes, and what the brand wants to do with it afterward.",
        ],
      },
      {
        heading: "What brands are really paying for",
        bullets: [
          { title: "Attention", text: "How many people will realistically see the content." },
          { title: "Trust", text: "How engaged your audience is, and how valuable your niche is to advertisers." },
          { title: "Content", text: "The time, skill, and production that go into making it." },
          { title: "Rights", text: "Reposting, paid ads, whitelisting, buyouts, and exclusivity." },
          { title: "Speed", text: "Rush timelines mean rearranging your schedule." },
        ],
      },
      {
        heading: "Turn your number into a quote",
        paragraphs: [
          "Once you have a starting price, generate an itemized quote — deliverables, usage rights, exclusivity — and a short reply you can paste into an email or DM.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is this rate guaranteed?",
        a: "No. It's a planning and negotiation starting point built on transparent assumptions. Real offers depend on the brand's budget, timing, your track record, and how the conversation goes.",
      },
      {
        q: "Why is my range wider than I expected?",
        a: "Ranges get wider when we have to estimate something (like your typical views) or when an input is unusual. Entering your real views and engagement tightens the range.",
      },
      {
        q: "Do I need an account? Do you store my data?",
        a: "No account needed. The calculation runs in your browser. We only collect anonymous usage events — never your name, handle, or exact numbers.",
      },
      {
        q: "Where do the numbers come from?",
        a: "From a published set of planning assumptions — price per 1,000 views by format, creation fees, and adjustment ranges. They're all listed on the methodology page, and they're versioned so changes are deliberate.",
      },
    ],
    related: ["micro-influencer-rate-calculator", "brand-deal-calculator", "instagram-rate-calculator", "tiktok-rate-calculator"],
  },
  {
    slug: "ugc-rate-calculator",
    linkLabel: "UGC rate calculator",
    blurb: "Price UGC on the work and the usage rights — not your audience size.",
    metaTitle: "UGC Rate Calculator: How Much to Charge for UGC Videos",
    metaDescription:
      "Free UGC rate calculator. Price UGC videos by effort and usage rights — paid ads, whitelisting, and buyouts — and generate a quote for the brand.",
    eyebrow: "UGC rate calculator",
    h1: "How much should you charge for UGC?",
    intro:
      "User-generated content isn't posted to your audience, so your follower count shouldn't set the price. Your work — and the rights the brand gets — should.",
    preset: { platform: "tiktok", contentType: "ugc" },
    usageTable: "all",
    sections: [
      {
        heading: "How UGC pricing works",
        paragraphs: [
          "A UGC rate has two parts: the content (concept, filming, editing) and the usage (how the brand can use it, and for how long). Posting on the brand's own organic channels is the lightest use; paid ads, whitelisting, and buyouts are worth progressively more.",
        ],
      },
      {
        heading: "Quote usage as its own line",
        paragraphs: [
          "Brands often ask for “UGC with usage included.” Itemize instead: a fee for the video plus a usage fee for a defined period. It makes your quote easier to approve — and makes extending the usage later an easy upsell.",
        ],
      },
      {
        heading: "Hooks, cut-downs, and raw footage",
        paragraphs: [
          "Extra hooks, alternate edits, or raw files are additional deliverables. Use the deliverables count to price variations, or quote them as add-ons.",
        ],
      },
    ],
    faqs: [
      {
        q: "Do UGC creators need followers?",
        a: "No. UGC is content made for the brand to publish, so your audience size doesn't drive the price. Your portfolio, the quality of the work, and the usage terms do.",
      },
      {
        q: "How much should I charge for paid usage on UGC?",
        a: "Price it as a share of the content fee that grows with the term — see the usage table on this page for the exact planning assumptions this calculator uses.",
      },
      {
        q: "What is a UGC buyout?",
        a: "A buyout gives the brand broad rights to use the content in any channel, often for a long or unlimited period. It's the most valuable kind of usage, so it should be the most expensive option.",
      },
      {
        q: "Should I charge for whitelisting on UGC?",
        a: "Yes. If the brand runs ads through your account (Spark Ads or partnership ads), your name and profile are attached to their ad spend — price it as whitelisting for a set period.",
      },
    ],
    related: ["usage-rights-calculator", "whitelisting-calculator", "tiktok-rate-calculator", "brand-deal-calculator"],
  },
  {
    slug: "instagram-reel-price-calculator",
    linkLabel: "Instagram Reel price calculator",
    blurb: "What to charge for a sponsored Reel, from plays, engagement, and effort.",
    metaTitle: "Instagram Reel Price Calculator: What to Charge for a Sponsored Reel",
    metaDescription:
      "How much should you charge for a sponsored Instagram Reel? Get a fair price range from your views and engagement, then copy a quote.",
    eyebrow: "Instagram Reel price calculator",
    h1: "How much should you charge for a sponsored Reel?",
    intro:
      "Reels are often the format brands want most. Price yours from your typical plays, engagement, and production effort — then add usage and exclusivity if the brand asks for them.",
    preset: { platform: "instagram", contentType: "reel" },
    sections: [
      {
        heading: "What makes a Reel worth more",
        bullets: [
          { title: "Typical plays", text: "Use what your Reels usually get, not your best-performing one." },
          { title: "Engagement", text: "Saves, shares, and comments show the audience is paying attention." },
          { title: "Production", text: "Scripting, locations, props, and editing all take time." },
          { title: "Usage", text: "Partnership ads and reposting are extra value for the brand." },
          { title: "Exclusivity", text: "Turning down competing brands has a real cost." },
        ],
      },
      {
        heading: "Partnership ads aren't free",
        paragraphs: [
          "Brands increasingly ask to run sponsored Reels as partnership ads. That means paid media behind your content and your name — price it as a time-limited whitelisting fee.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which views should I use for my Reel rate?",
        a: "Look at plays on your last 10 Reels and pick a typical number. Leaving out your one viral Reel gives you a rate you can defend when a brand checks your insights.",
      },
      {
        q: "Should a collab post cost more?",
        a: "A collab post also appears on the brand's profile, which gives them extra reach on your content. Many creators treat that as light organic usage and price it in.",
      },
      {
        q: "What if the brand also wants Stories?",
        a: "Add them as extra deliverables, or run the calculator for Stories separately and combine the two quotes.",
      },
    ],
    related: ["instagram-rate-calculator", "whitelisting-calculator", "usage-rights-calculator", "tiktok-sponsorship-calculator"],
  },
  {
    slug: "tiktok-sponsorship-calculator",
    linkLabel: "TikTok sponsorship calculator",
    blurb: "Price the whole TikTok deal: the video, Spark Ads, usage, and exclusivity.",
    metaTitle: "TikTok Sponsorship Calculator: Price Your Next Brand Deal",
    metaDescription:
      "Price a TikTok sponsorship in under a minute. Use your typical views and the brand's terms — usage, Spark Ads, exclusivity — to get a fair starting rate.",
    eyebrow: "TikTok sponsorship calculator",
    h1: "TikTok sponsorship calculator",
    intro:
      "Got a TikTok brand deal in your inbox? Price the whole package — the video, Spark Ads, usage, and exclusivity — and send back an itemized quote.",
    preset: { platform: "tiktok", contentType: "sponsored" },
    sections: [
      {
        heading: "Read the brief for hidden asks",
        paragraphs: [
          "Look for words like “usage,” “paid amplification,” “Spark Ads,” “whitelisting,” “exclusivity,” “in perpetuity,” and “raw footage.” Each one is extra value for the brand — and a line on your quote.",
        ],
      },
      {
        heading: "Pricing multiple videos",
        paragraphs: [
          "If a brand wants several videos, the calculator prices each extra piece slightly lower than the first (it's a bigger commitment), while still accounting for the work involved.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is a Spark Ads code, and should I charge for it?",
        a: "A Spark Ads code lets a brand run your post as an ad from your account. Yes — charge for it as whitelisting, for a set number of days.",
      },
      {
        q: "How long should Spark Ads usage last?",
        a: "Common requests are 30, 60, or 90 days. Shorter terms are easier to approve, and extending later is a natural upsell.",
      },
      {
        q: "What if the brand only offers free product?",
        a: "That's your call. Gifted deals can make sense for products you'd use anyway, but if the brand expects specific deliverables, usage, or deadlines, it's paid work.",
      },
    ],
    related: ["tiktok-rate-calculator", "whitelisting-calculator", "ugc-rate-calculator", "brand-deal-calculator"],
  },
  {
    slug: "brand-deal-calculator",
    linkLabel: "Brand deal calculator",
    blurb: "What to charge, why, and what to say back — for any brand deal.",
    metaTitle: "Brand Deal Calculator: How Much to Charge for a Sponsorship",
    metaDescription:
      "A brand wants to work with you. Find out how much to charge, see why, and copy a reply to send — free, no account needed.",
    eyebrow: "Brand deal calculator",
    h1: "Brand deal calculator",
    intro:
      "A brand wants to work with you. Answer a few questions about your audience and the deal, and get a fair starting price, a breakdown of where it comes from, and a reply you can send.",
    preset: {},
    sections: [
      {
        heading: "Three questions to answer before you reply",
        bullets: [
          { title: "What should I charge?", text: "A fair range and a recommended starting ask." },
          { title: "Why?", text: "A breakdown of reach, effort, and deal terms, so you can explain your number." },
          { title: "What should I say?", text: "An itemized quote and a short, friendly reply." },
        ],
      },
      {
        heading: "Price the deal, not just the post",
        paragraphs: [
          "A brand deal is more than one piece of content. Usage rights, exclusivity, the number of deliverables, and the deadline all change what's fair — and they're all negotiable.",
        ],
      },
    ],
    faqs: [
      {
        q: "What should I ask a brand before quoting?",
        a: "Which deliverables and platforms, the timeline, whether they want usage rights (and for how long), any exclusivity, and what budget they have in mind.",
      },
      {
        q: "Should I share my rate first or ask for their budget?",
        a: "Asking for their budget first is completely reasonable. If they want your rate first, quote near the top of your range so you have room to negotiate.",
      },
      {
        q: "How do I respond to a lowball offer?",
        a: "Thank them, restate your rate, and offer to adjust the scope — fewer deliverables, shorter usage, or no exclusivity — rather than simply cutting your price.",
      },
      {
        q: "Is this financial or legal advice?",
        a: "No. It's a planning tool to help you negotiate with confidence. For contracts, especially large or long-term ones, consider having a professional review the terms.",
      },
    ],
    related: ["brand-deal-email-templates", "exclusivity-fee-calculator", "usage-rights-calculator", "influencer-rate-calculator"],
  },
  {
    slug: "usage-rights-calculator",
    linkLabel: "Usage rights calculator",
    blurb: "Price organic reuse, paid ads, whitelisting, and buyouts by term.",
    metaTitle: "Usage Rights Calculator: How Much to Charge for Content Usage",
    metaDescription:
      "How much should you charge when a brand wants to reuse your content? Price organic usage, paid ads, whitelisting, and buyouts by term.",
    eyebrow: "Usage rights calculator",
    h1: "How much should you charge for usage rights?",
    intro:
      "When a brand wants to repost your content, run it as an ad, or own it outright, they're getting more value — and you should get paid for it. Here's how to price it.",
    preset: { usage: "paid" },
    usageTable: "all",
    sections: [
      {
        heading: "The four kinds of usage",
        bullets: [
          { title: "Organic reuse", text: "The brand reposts your content on its website, social channels, or emails — no paid ads." },
          { title: "Paid advertising", text: "The brand runs your content as ads from its own accounts." },
          { title: "Whitelisting", text: "The brand runs ads through your account, under your name (Spark Ads, partnership ads)." },
          { title: "Full buyout", text: "Broad commercial use in any channel, often for a long or unlimited period." },
        ],
      },
      {
        heading: "The term matters as much as the type",
        paragraphs: [
          "Usage should always have an end date. Thirty or ninety days is a common starting point for paid usage. Perpetual rights deserve a large premium — or a polite no.",
        ],
      },
    ],
    faqs: [
      {
        q: "What are usage rights?",
        a: "Permission for a brand to use your content beyond your own post — reposting it, running it as an ad, or using it in other marketing — for a defined period.",
      },
      {
        q: "Is whitelisting the same as paid usage?",
        a: "Not quite. With paid usage, the brand runs your content as ads from its own account. With whitelisting, the ads run through your account, under your name — which is usually worth more.",
      },
      {
        q: "Should usage be included in my base rate?",
        a: "It's clearer to quote it separately. A separate line shows the brand what they're paying for, and makes it easy to extend the usage later.",
      },
      {
        q: "What does “in perpetuity” mean?",
        a: "Forever. Perpetual usage means the brand can use your content indefinitely. Many creators avoid it or only accept it at a significant premium.",
      },
    ],
    related: ["whitelisting-calculator", "exclusivity-fee-calculator", "ugc-rate-calculator", "brand-deal-calculator"],
  },
  {
    slug: "whitelisting-calculator",
    linkLabel: "Whitelisting calculator",
    blurb: "Price Spark Ads and partnership ads by how long the brand can run them.",
    metaTitle: "Whitelisting Calculator: How to Price Spark Ads & Partnership Ads",
    metaDescription:
      "Price whitelisting, Spark Ads, and Instagram partnership ads. See how the term changes the fee and generate a quote for the brand.",
    eyebrow: "Whitelisting calculator",
    h1: "How much should you charge for whitelisting?",
    intro:
      "Whitelisting — Spark Ads on TikTok, partnership ads on Instagram — lets a brand run paid ads through your account. It's valuable to them and puts your name behind their ads, so price it deliberately.",
    preset: { usage: "whitelisting" },
    usageTable: "whitelisting",
    sections: [
      {
        heading: "What whitelisting means for you",
        bullets: [
          { text: "Ads appear from your handle, so your audience — and strangers — see the brand's message in your name." },
          { text: "The brand controls the ad spend, targeting, and often the caption." },
          { text: "Comments on the ad land on your content, and you may need to moderate them." },
        ],
      },
      {
        heading: "Protect yourself in the agreement",
        paragraphs: [
          "Agree on the term, which pieces of content can be used, whether the brand can edit captions, and how access ends when the term is over. Always use the platform's official tools — never share your login.",
        ],
      },
    ],
    faqs: [
      {
        q: "What's the difference between Spark Ads and partnership ads?",
        a: "They're the same idea on different platforms. Spark Ads (TikTok) and partnership ads (Instagram and Facebook) both let a brand run ads using your post and your identity.",
      },
      {
        q: "How long should whitelisting last?",
        a: "Thirty to ninety days is a common starting point. Shorter terms are easier to approve, and you can charge again to extend.",
      },
      {
        q: "Should I give the brand access to my account?",
        a: "No. Use the platform's official permissions — a Spark Ads code or partnership ad approval — instead of sharing a password.",
      },
      {
        q: "Can I charge for whitelisting on UGC?",
        a: "Yes. If the ads run through your account, your name is attached to them, whatever the content was made for.",
      },
    ],
    related: ["usage-rights-calculator", "tiktok-sponsorship-calculator", "instagram-reel-price-calculator", "ugc-rate-calculator"],
  },
  {
    slug: "instagram-story-price-calculator",
    linkLabel: "Instagram Story price calculator",
    blurb: "What to charge for sponsored Stories, from your typical Story views.",
    metaTitle: "Instagram Story Price Calculator: What to Charge for Sponsored Stories",
    metaDescription:
      "How much should you charge for a sponsored Instagram Story? Price a Story set from your typical Story views, engagement, and the brand's terms.",
    eyebrow: "Instagram Story price calculator",
    h1: "How much should you charge for an Instagram Story?",
    intro:
      "Stories reach fewer people than Reels and disappear after a day — but they're quick to make, great for links, and easy to bundle. Price a sponsored Story set from your typical Story views.",
    preset: { platform: "instagram", contentType: "story" },
    sections: [
      {
        heading: "Price a set, not a single frame",
        paragraphs: [
          "Brands usually ask for a short sequence — say, three frames with a link sticker. This calculator prices a set of up to three frames as one Story deliverable. Longer sequences or several days of Stories are extra deliverables.",
        ],
      },
      {
        heading: "Use Story views, not followers",
        paragraphs: [
          "Story views are usually a small fraction of your followers, so pricing Stories from follower count overshoots. Check the views on your last ten Stories in Insights and use a typical number.",
        ],
      },
      {
        heading: "When Stories are worth more",
        bullets: [
          { title: "Link clicks", text: "If your Stories reliably drive taps on links, mention it — it's what many brands are buying." },
          { title: "Bundles", text: "Stories pair well with a Reel or post. Add them as extra deliverables on the same quote." },
          { title: "Usage", text: "If the brand wants to reuse Story footage in ads, that's paid usage and should be priced separately." },
        ],
      },
    ],
    faqs: [
      {
        q: "Should Stories cost less than a Reel?",
        a: "Usually, yes — they reach fewer people and take less work. In this calculator a Story set starts from a lower reach estimate and a lower creation fee than a Reel.",
      },
      {
        q: "Do link stickers change the price?",
        a: "They change what the brand gets. If your Stories drive meaningful link taps, use that as a reason to quote toward the top of your range.",
      },
      {
        q: "What if the brand wants Stories every day for a week?",
        a: "Price each day's set as a deliverable. The calculator discounts extra deliverables slightly, since a bigger commitment usually earns a small bundle price.",
      },
    ],
    related: ["instagram-rate-calculator", "instagram-reel-price-calculator", "usage-rights-calculator", "brand-deal-email-templates"],
  },
  {
    slug: "youtube-shorts-sponsorship-calculator",
    linkLabel: "YouTube Shorts sponsorship calculator",
    blurb: "Price a sponsored YouTube Short from the views your Shorts actually get.",
    metaTitle: "YouTube Shorts Sponsorship Calculator: What to Charge for a Sponsored Short",
    metaDescription:
      "How much should you charge for a sponsored YouTube Short? Get a fair price range from your typical Shorts views, engagement, and the deal terms.",
    eyebrow: "YouTube Shorts sponsorship calculator",
    h1: "How much should you charge for a sponsored YouTube Short?",
    intro:
      "Shorts are priced more like Reels and TikToks than long-form YouTube videos. Price yours from your typical Shorts views — and add usage if the brand wants to cut it into ads.",
    preset: { platform: "youtube", contentType: "short" },
    sections: [
      {
        heading: "Shorts views behave differently",
        paragraphs: [
          "A Short can reach far beyond your subscribers — or stall. Look at the views on your last ten Shorts in YouTube Studio and use a typical number, not your best one.",
          "Keep Shorts and long-form separate: a channel's long-form views are often a very different number from its Shorts views.",
        ],
      },
      {
        heading: "Shorts vs. integrations",
        paragraphs: [
          "An integration buys a segment inside a long-form video that people chose to watch. A Short buys a quick, vertical moment in a feed. Both have value; they just aren't priced the same way, which is why the calculator treats them as different formats.",
        ],
      },
    ],
    faqs: [
      {
        q: "Should I price a Short like a TikTok?",
        a: "They're similar formats, so the planning assumptions are close. Your actual views on each platform matter more than the platform itself.",
      },
      {
        q: "Can I bundle a Short with an integration?",
        a: "Yes. Quote them as separate lines: the integration priced from long-form views, the Short from Shorts views. Bundles make it easy for brands to say yes.",
      },
      {
        q: "What if the brand wants to reuse my Short as an ad?",
        a: "That's paid usage. Add it as its own line on your quote with a clear time limit, like 30 or 90 days.",
      },
    ],
    related: ["youtube-rate-calculator", "tiktok-rate-calculator", "usage-rights-calculator", "brand-deal-email-templates"],
  },
  {
    slug: "micro-influencer-rate-calculator",
    linkLabel: "Micro-influencer rate calculator",
    blurb: "Fair rates for 10K–100K creators, priced on reach and engagement.",
    metaTitle: "Micro-Influencer Rate Calculator: What Should a 10K–100K Creator Charge?",
    metaDescription:
      "What should a micro-influencer charge? Get a fair starting price for 10K–100K-follower creators from your real views, engagement, and the deal terms.",
    eyebrow: "Micro-influencer rate calculator",
    h1: "What should a micro-influencer charge?",
    intro:
      "Micro-influencers — roughly 10,000 to 100,000 followers — often have more engaged audiences than bigger accounts. Here's how to price that fairly, without underselling yourself.",
    preset: {},
    sections: [
      {
        heading: "Engagement is your leverage",
        paragraphs: [
          "Smaller accounts tend to have higher engagement, and brands know it. This calculator compares your engagement with what's typical for your platform and account size, so strong engagement moves your price up.",
        ],
      },
      {
        heading: "Your work still costs money",
        paragraphs: [
          "Even with a modest audience, a sponsored post takes real time: ideas, filming, editing, revisions. That's why every estimate includes a content creation fee on top of your audience value — you're never priced at a few dollars per thousand views.",
        ],
      },
      {
        heading: "Where micro-influencers lose the most money",
        bullets: [
          { title: "Free usage", text: "Saying yes to “we'll also use it in ads” without a usage fee." },
          { title: "Open-ended exclusivity", text: "Agreeing not to work with competitors with no end date or extra pay." },
          { title: "Gifted deals with paid-deal demands", text: "Product-only offers that still expect deadlines, scripts, and usage." },
        ],
      },
    ],
    faqs: [
      {
        q: "How much should a creator with 10K followers charge?",
        a: "It depends much more on views, engagement, format, and terms than on the follower count. Run the calculator with your real numbers — a 10K account with strong views can deserve far more than a rule of thumb suggests.",
      },
      {
        q: "Should micro-influencers accept gifted collaborations?",
        a: "Sometimes — for products you'd genuinely use, with no strings attached. If the brand wants specific deliverables, deadlines, or usage rights, it's paid work.",
      },
      {
        q: "Is it OK to charge more than my last deal?",
        a: "Yes. Rates should rise as your audience, results, and portfolio grow. Quoting a higher number to the next brand is completely normal.",
      },
    ],
    related: ["influencer-rate-calculator", "instagram-rate-calculator", "tiktok-rate-calculator", "brand-deal-email-templates"],
  },
  {
    slug: "exclusivity-fee-calculator",
    linkLabel: "Exclusivity fee calculator",
    blurb: "How much to charge when a brand asks you not to work with competitors.",
    metaTitle: "Exclusivity Fee Calculator: How Much to Charge for Influencer Exclusivity",
    metaDescription:
      "A brand wants exclusivity? Price the deals you'll have to turn down. See how exclusivity length changes your fee and generate a quote.",
    eyebrow: "Exclusivity fee calculator",
    h1: "How much should you charge for exclusivity?",
    intro:
      "When a brand asks you not to work with competitors, you're giving up future income. Exclusivity should be priced as its own line — and it should have an end date.",
    preset: { exclusivity: "30d" },
    exclusivityTable: true,
    sections: [
      {
        heading: "What you're really selling",
        paragraphs: [
          "Exclusivity is an opportunity cost: every week you can't work with a competitor is a week of deals you might turn down. The longer the period and the busier your category, the more it's worth.",
        ],
      },
      {
        heading: "Read the exclusivity clause carefully",
        bullets: [
          { title: "Category", text: "“Competitors” should be specific — named brands or a narrow category, not “any beauty brand.”" },
          { title: "Length", text: "Every exclusivity period needs an end date. Shorter periods are easier to price and accept." },
          { title: "Start", text: "Agree whether it starts at signing or when the content goes live." },
        ],
      },
    ],
    faqs: [
      {
        q: "Is exclusivity normal in brand deals?",
        a: "It's common, especially in competitive categories. What's not fine is unpaid, open-ended exclusivity. Price it, limit it, and define the category.",
      },
      {
        q: "Should I charge for exclusivity if I wasn't going to work with competitors anyway?",
        a: "Yes. Exclusivity removes options you might have had, and brands value the guarantee. You can always lower the fee if it's a long-term partnership you want.",
      },
      {
        q: "How does this calculator price exclusivity?",
        a: "As a share of the content fee that grows with the length of the period — see the table on this page for the exact planning assumptions.",
      },
    ],
    related: ["usage-rights-calculator", "brand-deal-calculator", "whitelisting-calculator", "brand-deal-email-templates"],
  },
];

export function getLandingPage(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug);
}

/** Non-calculator pages that link cards can point to (they have their own routes). */
export const GUIDES: { slug: string; linkLabel: string; blurb: string }[] = [
  {
    slug: "brand-deal-email-templates",
    linkLabel: "Brand deal email templates",
    blurb: "Copy-ready replies for quoting, countering, and adding usage fees.",
  },
];

/** Any linkable page by slug: calculators first, then guides. */
export function getLinkTarget(slug: string): { slug: string; linkLabel: string; blurb: string } | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug) ?? GUIDES.find((g) => g.slug === slug);
}
