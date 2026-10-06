/**
 * YouTube Data API v3 → ProfileStats.
 *
 * Pure apart from the injected fetch, so it runs in the serverless endpoint
 * and in unit tests alike. Each lookup costs 3 quota units (channels.list,
 * playlistItems.list and videos.list are 1 unit each) out of the default
 * 10,000 a day.
 */
import type { ParsedHandle } from "./parse-handle";
import { type FormatStats, LookupFailure, type ProfileStats, median } from "./types";

const API = "https://www.googleapis.com/youtube/v3";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Shorts can run up to 3 minutes. */
const SHORT_MAX_SECONDS = 180;
/** Views keep climbing for the first days, so prefer videos at least this old… */
const SETTLED_AFTER_MS = 7 * DAY_MS;
/** …but not so old that years of search traffic inflate them. */
const RECENT_WITHIN_MS = 180 * DAY_MS;
/** Videos per format that the medians come from. */
const SAMPLE_SIZE = 15;
/** With fewer settled videos than this, top up with older, then newer ones. */
const MIN_SAMPLE = 3;
/** Uploads checked per lookup (one page of the uploads playlist). */
const RECENT_UPLOADS = 50;

export type FetchLike = (url: string) => Promise<Response>;

// The slices of the API responses we read. Counts arrive as strings.
export interface YouTubeChannel {
  id: string;
  snippet?: {
    title?: string;
    customUrl?: string;
    thumbnails?: Partial<Record<"default" | "medium" | "high", { url?: string }>>;
  };
  statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
}

export interface YouTubeVideo {
  id: string;
  snippet?: { publishedAt?: string; liveBroadcastContent?: string };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  /** Only present when the request sets maxWidth/maxHeight and the aspect ratio is known. */
  player?: { embedWidth?: string | number; embedHeight?: string | number };
}

interface ApiErrorBody {
  error?: { code?: number; errors?: { reason?: string }[] };
}

/** "PT1M5S" → 65. Null when missing or unparseable. */
export function durationSeconds(iso: string | undefined): number | null {
  const match = iso ? /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso) : null;
  if (!match) return null;
  const [, days = "0", hours = "0", minutes = "0", seconds = "0"] = match;
  return Number(days) * 86_400 + Number(hours) * 3_600 + Number(minutes) * 60 + Number(seconds);
}

/**
 * The API has no "is a Short" field. Anything over 3 minutes is long-form;
 * a brief video counts as a Short unless we know it's horizontal.
 */
export function videoFormat(video: YouTubeVideo): "long" | "short" | null {
  const seconds = durationSeconds(video.contentDetails?.duration);
  if (!seconds) return null;
  if (seconds > SHORT_MAX_SECONDS) return "long";
  const width = Number(video.player?.embedWidth);
  const height = Number(video.player?.embedHeight);
  return width > 0 && height > 0 && width > height ? "long" : "short";
}

export interface VideoSample {
  publishedAt: number;
  views: number;
  /** (likes + comments) / views × 100, or null when likes are hidden. */
  engagementRate: number | null;
}

/** 0.0432 → 0.04, 4.27 → 4.3: the precision the calculator's field uses. */
function roundRate(rate: number | null): number | null {
  return rate === null ? null : Number(rate.toFixed(rate < 1 ? 2 : 1));
}

/**
 * Typical performance: medians of recent videos that have had a week to
 * settle — close to the "first 30 days" views brands ask about.
 */
export function summarizeFormat(samples: VideoSample[], now: number): FormatStats | null {
  const newestFirst = [...samples].sort((a, b) => b.publishedAt - a.publishedAt);
  const age = (s: VideoSample) => now - s.publishedAt;
  const settled = newestFirst.filter((s) => age(s) >= SETTLED_AFTER_MS && age(s) <= RECENT_WITHIN_MS);
  const older = newestFirst.filter((s) => age(s) > RECENT_WITHIN_MS);
  // Oldest first: the new videos that have had the most time to collect views.
  const fresh = newestFirst.filter((s) => age(s) < SETTLED_AFTER_MS).reverse();

  const picked = settled.slice(0, SAMPLE_SIZE);
  for (const sample of [...older, ...fresh]) {
    if (picked.length >= MIN_SAMPLE) break;
    picked.push(sample);
  }
  if (!picked.length) return null;

  const views = median(picked.map((s) => s.views));
  const rates = picked.flatMap((s) => (s.engagementRate === null ? [] : [s.engagementRate]));
  return {
    typicalViews: views === null ? null : Math.round(views),
    engagementRate: roundRate(median(rates)),
    sampleSize: picked.length,
  };
}

export function toProfileStats(channel: YouTubeChannel, videos: YouTubeVideo[], now: number): ProfileStats {
  const samples: Record<"long" | "short", VideoSample[]> = { long: [], short: [] };
  for (const video of videos) {
    // Live and upcoming broadcasts don't have settled numbers yet.
    if ((video.snippet?.liveBroadcastContent ?? "none") !== "none") continue;
    const format = videoFormat(video);
    const views = Number(video.statistics?.viewCount);
    const publishedAt = Date.parse(video.snippet?.publishedAt ?? "");
    if (!format || !Number.isFinite(views) || !Number.isFinite(publishedAt)) continue;

    const likes = video.statistics?.likeCount;
    const comments = Number(video.statistics?.commentCount ?? 0);
    const engagementRate = likes !== undefined && views > 0 ? ((Number(likes) + comments) / views) * 100 : null;
    samples[format].push({ publishedAt, views, engagementRate });
  }

  const formats: ProfileStats["formats"] = {};
  for (const key of ["long", "short"] as const) {
    const stats = summarizeFormat(samples[key], now);
    if (stats) formats[key] = stats;
  }

  const stats = channel.statistics;
  const subscribers = stats?.hiddenSubscriberCount ? Number.NaN : Number(stats?.subscriberCount);
  const customUrl = channel.snippet?.customUrl;
  const handle = customUrl ? (customUrl.startsWith("@") ? customUrl : `@${customUrl}`) : "";
  const thumbnails = channel.snippet?.thumbnails;

  return {
    platform: "youtube",
    handle,
    displayName: channel.snippet?.title ?? handle,
    avatarUrl: thumbnails?.medium?.url ?? thumbnails?.default?.url,
    profileUrl: handle ? `https://www.youtube.com/${handle}` : `https://www.youtube.com/channel/${channel.id}`,
    followers: Number.isFinite(subscribers) ? subscribers : null,
    formats,
    fetchedAt: new Date(now).toISOString(),
  };
}

async function call<T>(fetchImpl: FetchLike, path: string, params: Record<string, string>, apiKey: string): Promise<T> {
  const url = `${API}/${path}?${new URLSearchParams({ ...params, key: apiKey })}`;
  let response: Response;
  try {
    response = await fetchImpl(url);
  } catch {
    throw new LookupFailure("unavailable", "We couldn't reach YouTube. Try again in a moment.");
  }
  const body = (await response.json().catch(() => null)) as (T & ApiErrorBody) | null;
  if (response.ok && body) return body;
  if (response.status === 404) throw new LookupFailure("not_found", "We couldn't find that YouTube channel.");
  // Quota exhausted, a bad key, an API outage: nothing the creator can fix.
  throw new LookupFailure("unavailable", "YouTube lookups aren't available right now.");
}

async function recentUploadIds(fetchImpl: FetchLike, playlistId: string, apiKey: string): Promise<string[]> {
  try {
    const page = await call<{ items?: { contentDetails?: { videoId?: string } }[] }>(
      fetchImpl,
      "playlistItems",
      { part: "contentDetails", playlistId, maxResults: String(RECENT_UPLOADS) },
      apiKey,
    );
    return (page.items ?? []).flatMap((item) => (item.contentDetails?.videoId ? [item.contentDetails.videoId] : []));
  } catch (error) {
    // A channel without uploads has no uploads playlist.
    if (error instanceof LookupFailure && error.code === "not_found") return [];
    throw error;
  }
}

export async function fetchYouTubeProfile(
  parsed: ParsedHandle,
  { apiKey, fetchImpl, now = Date.now() }: { apiKey: string; fetchImpl: FetchLike; now?: number },
): Promise<ProfileStats> {
  const by = parsed.kind === "channelId" ? "id" : parsed.kind === "username" ? "forUsername" : "forHandle";
  const { items } = await call<{ items?: YouTubeChannel[] }>(
    fetchImpl,
    "channels",
    { part: "snippet,statistics,contentDetails", [by]: parsed.handle },
    apiKey,
  );
  const channel = items?.[0];
  if (!channel) throw new LookupFailure("not_found", "We couldn't find that YouTube channel.");

  const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
  const ids = uploads ? await recentUploadIds(fetchImpl, uploads, apiKey) : [];
  const videos = ids.length
    ? ((
        await call<{ items?: YouTubeVideo[] }>(
          fetchImpl,
          "videos",
          // maxWidth makes the API report the player's aspect ratio (vertical = Short).
          { part: "snippet,contentDetails,statistics,player", id: ids.join(","), maxWidth: "480" },
          apiKey,
        )
      ).items ?? [])
    : [];

  return toProfileStats(channel, videos, now);
}
