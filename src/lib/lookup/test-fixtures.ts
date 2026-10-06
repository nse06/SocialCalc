/**
 * Fake YouTube Data API for unit tests: a small channel with long-form
 * videos, Shorts, and the awkward cases (hidden likes, live, brand new, old).
 */
import type { YouTubeChannel, YouTubeVideo } from "./youtube";

export const NOW = Date.parse("2026-10-06T12:00:00Z");
const daysAgo = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

interface VideoSpec {
  days: number;
  duration: string;
  views: number;
  likes?: number;
  comments?: number;
  /** Player aspect ratio, when the API reports it. */
  shape?: "vertical" | "horizontal";
  live?: "live" | "upcoming";
}

function video(id: string, spec: VideoSpec): YouTubeVideo {
  return {
    id,
    snippet: { publishedAt: daysAgo(spec.days), liveBroadcastContent: spec.live ?? "none" },
    contentDetails: { duration: spec.duration },
    statistics: {
      viewCount: String(spec.views),
      ...(spec.likes === undefined ? {} : { likeCount: String(spec.likes) }),
      commentCount: String(spec.comments ?? 0),
    },
    ...(spec.shape ? { player: spec.shape === "vertical" ? { embedWidth: "270", embedHeight: "480" } : { embedWidth: "480", embedHeight: "270" } } : {}),
  };
}

export const CHANNEL: YouTubeChannel = {
  id: "UCabcdefghijklmnopqrstuv",
  snippet: {
    title: "Test Kitchen",
    customUrl: "@testkitchen",
    thumbnails: { default: { url: "https://yt3.ggpht.com/test=s88" }, medium: { url: "https://yt3.ggpht.com/test=s240" } },
  },
  statistics: { subscriberCount: "125000", hiddenSubscriberCount: false },
  contentDetails: { relatedPlaylists: { uploads: "UUabcdefghijklmnopqrstuv" } },
};

export const VIDEOS: YouTubeVideo[] = [
  video("fresh-long", { days: 2, duration: "PT11M", views: 9_000, likes: 500 }),
  video("long-1", { days: 10, duration: "PT8M30S", views: 40_000, likes: 1_600, comments: 200 }),
  video("short-1", { days: 8, duration: "PT45S", views: 120_000, likes: 6_000, comments: 100, shape: "vertical" }),
  video("short-2", { days: 15, duration: "PT1M10S", views: 80_000, likes: 3_000, comments: 50, shape: "vertical" }),
  video("brief-horizontal", { days: 20, duration: "PT2M30S", views: 30_000, likes: 1_000, shape: "horizontal" }),
  video("long-2", { days: 24, duration: "PT12M5S", views: 52_000, likes: 1_900, comments: 80 }),
  video("short-3", { days: 30, duration: "PT2M30S", views: 100_000, likes: 4_000, shape: "vertical" }),
  video("long-3", { days: 45, duration: "PT10M", views: 61_000, likes: 2_500, comments: 300 }),
  video("likes-hidden", { days: 70, duration: "PT9M12S", views: 38_000 }),
  video("old-viral", { days: 400, duration: "PT9M", views: 900_000, likes: 40_000 }),
  video("premiere", { days: 0, duration: "P0D", views: 0, live: "upcoming" }),
];

type Endpoint = "channels" | "playlistItems" | "videos";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** A fetch that answers like the YouTube Data API, recording every request. */
export function fakeYouTubeApi(
  options: { channels?: YouTubeChannel[]; videos?: YouTubeVideo[]; status?: Partial<Record<Endpoint, number>> } = {},
) {
  const calls: URL[] = [];
  const fetchImpl = async (input: string) => {
    const url = new URL(input);
    calls.push(url);
    const endpoint = url.pathname.split("/").pop() as Endpoint;
    const status = options.status?.[endpoint] ?? 200;
    if (status !== 200) {
      const reason = status === 403 ? "quotaExceeded" : status === 404 ? "playlistNotFound" : "backendError";
      return jsonResponse({ error: { code: status, errors: [{ reason }] } }, status);
    }
    const videos = options.videos ?? VIDEOS;
    if (endpoint === "channels") return jsonResponse({ items: options.channels ?? [CHANNEL] });
    if (endpoint === "playlistItems") return jsonResponse({ items: videos.map((v) => ({ contentDetails: { videoId: v.id } })) });
    const ids = url.searchParams.get("id")?.split(",") ?? [];
    return jsonResponse({ items: videos.filter((v) => ids.includes(v.id)) });
  };
  return { fetchImpl, calls };
}
