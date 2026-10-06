/**
 * A deterministic, keyword-based extractor. Good enough for clear briefs
 * ("one TikTok, 6 months of paid usage, 90 days of exclusivity") and free to
 * run. A model-backed extractor can replace it behind the same interface.
 */
import type { DraftPreset } from "@/lib/pricing/draft";
import type { ExclusivityId, PlatformId, TimelineId, UsageDurationId, UsageTypeId } from "@/lib/pricing/types";
import type { DealTermsExtractor, ExtractedDealTerms } from "./types";

const WORD_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  single: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twelve: 12,
};

const NUMBER = String.raw`(\d+|an?|one|single|two|three|four|five|six|seven|eight|nine|ten|twelve)`;

function toNumber(token: string): number {
  return WORD_NUMBERS[token.toLowerCase()] ?? Number.parseInt(token, 10);
}

const PLATFORM_PATTERNS: [PlatformId, RegExp][] = [
  ["tiktok", /\btik\s?toks?\b|\bspark ads?\b/gi],
  ["instagram", /\binstagram\b|\binsta\b|\big\b|\breels?\b/gi],
  ["youtube", /\byoutube\b|\byt\b|\bshorts\b/gi],
  ["linkedin", /\blinkedin\b/gi],
  ["twitch", /\btwitch\b|\blive ?stream/gi],
  ["x", /\btwitter\b|\btweets?\b|\bon x\b/gi],
];

/** Days represented by "6 months", "90 days", "a year"… */
function durationDays(amount: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u.startsWith("day")) return amount;
  if (u.startsWith("week")) return amount * 7;
  if (u.startsWith("month")) return amount * 30;
  return amount * 365;
}

function usageBucket(days: number): UsageDurationId {
  if (days <= 45) return "30d";
  if (days <= 120) return "90d";
  if (days <= 270) return "6m";
  return "12m";
}

function exclusivityBucket(days: number): ExclusivityId {
  if (days <= 10) return "7d";
  if (days <= 45) return "30d";
  if (days <= 120) return "90d";
  return "6m";
}

function detectPlatform(text: string): { platform?: PlatformId; evidence?: string } {
  let best: { platform: PlatformId; count: number; first: number; evidence: string } | null = null;
  for (const [platform, pattern] of PLATFORM_PATTERNS) {
    const matches = [...text.matchAll(pattern)];
    if (!matches.length) continue;
    const candidate = { platform, count: matches.length, first: matches[0].index ?? 0, evidence: matches[0][0] };
    if (!best || candidate.count > best.count || (candidate.count === best.count && candidate.first < best.first)) {
      best = candidate;
    }
  }
  return best ? { platform: best.platform, evidence: best.evidence } : {};
}

function detectContentType(text: string, platform: PlatformId | undefined): { contentType?: string; evidence?: string } {
  const t = text.toLowerCase();
  const find = (re: RegExp) => re.exec(t)?.[0];
  const ugc = find(/\bugc\b|user[- ]generated/);
  if (ugc && (platform === "tiktok" || platform === "other" || !platform)) return { contentType: "ugc", evidence: ugc };
  switch (platform) {
    case "instagram": {
      const hit =
        (find(/\breels?\b/) && "reel") ||
        (find(/\bcarousels?\b/) && "carousel") ||
        (find(/\bstor(y|ies)\b/) && "story") ||
        (find(/\b(feed|static|grid) posts?\b|\bposts?\b/) && "feed-post");
      return hit ? { contentType: hit, evidence: hit } : {};
    }
    case "tiktok": {
      const story = find(/\bstor(y|ies)\b/);
      return story ? { contentType: "plus-story", evidence: story } : { contentType: "sponsored", evidence: "TikTok" };
    }
    case "youtube": {
      const dedicated = find(/\bdedicated\b/);
      if (dedicated) return { contentType: "dedicated", evidence: dedicated };
      const integration = find(/\bintegrat\w*|\bsegment\b|\bmention\b|\bad read\b/);
      if (integration) return { contentType: "integration", evidence: integration };
      const short = find(/\bshorts?\b/);
      return short ? { contentType: "short", evidence: short } : {};
    }
    case "x":
      return find(/\bthread\b/) ? { contentType: "thread", evidence: "thread" } : { contentType: "post", evidence: "post" };
    case "linkedin":
      return find(/\bvideo\b/) ? { contentType: "video", evidence: "video" } : { contentType: "post", evidence: "post" };
    case "twitch":
      return find(/\bdedicated\b/)
        ? { contentType: "dedicated-stream", evidence: "dedicated" }
        : { contentType: "segment", evidence: "stream" };
    default:
      return {};
  }
}

function detectDeliverables(text: string): { deliverables?: number; evidence?: string } {
  const re = new RegExp(
    String.raw`\b${NUMBER}\s+(?:sponsored\s+|dedicated\s+|short\s+|ugc\s+|instagram\s+|tiktok\s+|youtube\s+)*(tik\s?toks?|videos?|reels?|posts?|stories|story|carousels?|shorts?|integrations?|tweets?|threads?|streams?|pieces?|deliverables?)\b`,
    "gi",
  );
  let total = 0;
  let evidence = "";
  for (const match of text.matchAll(re)) {
    const n = toNumber(match[1]);
    if (Number.isFinite(n) && n > 0 && n <= 50) {
      total += n;
      evidence = evidence ? `${evidence}, ${match[0]}` : match[0];
    }
  }
  return total ? { deliverables: Math.min(total, 20), evidence } : {};
}

function detectUsageType(text: string): { usage?: UsageTypeId; evidence?: string; perpetual?: boolean } {
  const t = text.toLowerCase();
  const perpetual = /\bperpetu\w*|\bin perpetuity\b|\bforever\b/.test(t);
  const rules: [UsageTypeId, RegExp][] = [
    ["whitelisting", /\bwhite-?listing\b|\bwhitelist\w*|\ballow-?list\w*|\bspark ads?\b|\bspark code\b|\bpartnership ads?\b|\bbranded content ads?\b/],
    ["buyout", /\bbuy-?out\b|\bfull rights\b|\ball media\b|\bunlimited usage\b/],
    ["paid", /\bpaid (usage|media|ads?|social|amplification)\b|\bboost(ing)?\b|\bamplif\w*|\bads?\b/],
    ["organic", /\borganic\b|\brepost\w*|\bshare it on our\b|\bour (website|channels|social|newsletter)\b/],
  ];
  for (const [usage, re] of rules) {
    const match = re.exec(t);
    if (match) return { usage, evidence: match[0], perpetual };
  }
  return perpetual ? { usage: "buyout", evidence: "perpetuity", perpetual } : {};
}

function detectDurations(text: string): { usageDuration?: UsageDurationId; exclusivity?: ExclusivityId; usageEvidence?: string; exclusivityEvidence?: string } {
  const out: ReturnType<typeof detectDurations> = {};
  const re = new RegExp(String.raw`\b${NUMBER}[\s-]*(days?|weeks?|months?|years?)\b`, "gi");
  for (const match of text.matchAll(re)) {
    const index = match.index ?? 0;
    const around = text.slice(Math.max(0, index - 50), index + match[0].length + 50).toLowerCase();
    const days = durationDays(toNumber(match[1]), match[2]);
    const exclusivityNear = /exclusiv|compet/.test(around);
    const usageNear = /usage|rights|ads?\b|whitelist|spark|boost|paid|licens|repost|organic|buy-?out/.test(around);
    // Prefer the keyword closest after the duration ("90 days of exclusivity").
    const after = text.slice(index, index + match[0].length + 30).toLowerCase();
    if (exclusivityNear && (/exclusiv|compet/.test(after) || !usageNear) && !out.exclusivity) {
      out.exclusivity = exclusivityBucket(days);
      out.exclusivityEvidence = match[0];
    } else if (usageNear && !out.usageDuration) {
      out.usageDuration = usageBucket(days);
      out.usageEvidence = match[0];
    }
  }
  return out;
}

function detectTimeline(text: string): { timeline?: TimelineId; evidence?: string } {
  const t = text.toLowerCase();
  const rules: [TimelineId, RegExp][] = [
    ["rush", /\basap\b|\burgent\w*|\btomorrow\b|\b(24|48)[\s-]*hours?\b|\bend of (the )?day\b/],
    ["3d", /\bwithin (2|3|two|three) days\b|\bin (2|3|two|three) days\b|\bby (this )?(monday|tuesday|wednesday|thursday|friday)\b/],
    ["1w", /\bwithin (a|one|1) week\b|\bnext week\b|\bin (a|one|1) week\b|\bwithin (5|7|five|seven) days\b/],
  ];
  for (const [timeline, re] of rules) {
    const match = re.exec(t);
    if (match) return { timeline, evidence: match[0] };
  }
  return {};
}

const UNPRICED: [string, RegExp][] = [
  ["Raw footage", /\braw (footage|files)\b/i],
  ["Extra hooks or cut-downs", /\bhooks?\b|\bcut-?downs?\b|\bvariations?\b/i],
  ["Revisions", /\brevisions?\b|\bedits? rounds?\b/i],
  ["Link in bio", /\blink in bio\b/i],
];

export function extractDealTermsSync(text: string): ExtractedDealTerms {
  const preset: DraftPreset = {};
  const evidence: ExtractedDealTerms["evidence"] = {};

  const platform = detectPlatform(text);
  const ugcOnly = /\bugc\b|user[- ]generated/i.test(text) && !platform.platform;
  const platformId: PlatformId | undefined = platform.platform ?? (ugcOnly ? "tiktok" : undefined);
  if (platformId) {
    preset.platform = platformId;
    evidence.platform = platform.evidence ?? "UGC";
  }

  const content = detectContentType(text, platformId);
  if (content.contentType) {
    preset.contentType = content.contentType;
    evidence.contentType = content.evidence;
  }

  const count = detectDeliverables(text);
  if (count.deliverables) {
    preset.deliverables = count.deliverables;
    evidence.deliverables = count.evidence;
  }

  const usage = detectUsageType(text);
  const durations = detectDurations(text);
  if (usage.usage) {
    preset.usage = usage.usage;
    evidence.usage = usage.evidence;
    if (usage.perpetual) {
      preset.usageDuration = "perpetual";
      evidence.usageDuration = "perpetuity";
    } else if (durations.usageDuration) {
      preset.usageDuration = durations.usageDuration;
      evidence.usageDuration = durations.usageEvidence;
    }
  }
  if (/\bno exclusivity\b|\bnon-?exclusive\b/i.test(text)) {
    preset.exclusivity = "none";
    evidence.exclusivity = "no exclusivity";
  } else if (durations.exclusivity) {
    preset.exclusivity = durations.exclusivity;
    evidence.exclusivity = durations.exclusivityEvidence;
  }

  const timeline = detectTimeline(text);
  if (timeline.timeline) {
    preset.timeline = timeline.timeline;
    evidence.timeline = timeline.evidence;
  }

  const unpriced = UNPRICED.filter(([, re]) => re.test(text)).map(([label]) => label);
  return { preset, evidence, unpriced, source: "heuristic" };
}

export const heuristicExtractor: DealTermsExtractor = {
  extract: async (text) => extractDealTermsSync(text),
};
