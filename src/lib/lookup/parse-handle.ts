import type { LookupPlatform } from "./types";

export interface ParsedHandle {
  platform: LookupPlatform;
  /** "@name" for handles, a raw channel id ("UC…") or a legacy YouTube username. */
  handle: string;
  kind: "handle" | "channelId" | "username";
}

const HANDLE = /^[A-Za-z0-9._-]{2,30}$/;
const YT_CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
const MAX_INPUT_LENGTH = 200;

function fromUrl(url: URL): ParsedHandle | null {
  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");
  const [first, second] = url.pathname.split("/").filter(Boolean);
  if (!first) return null;

  if (host === "youtube.com") {
    if (first.startsWith("@") && HANDLE.test(first.slice(1))) return { platform: "youtube", handle: first, kind: "handle" };
    if (first === "channel" && second && YT_CHANNEL_ID.test(second)) {
      return { platform: "youtube", handle: second, kind: "channelId" };
    }
    if (first === "user" && second && HANDLE.test(second)) return { platform: "youtube", handle: second, kind: "username" };
    // Old custom URLs (/c/name) usually became the channel's handle.
    if (first === "c" && second && HANDLE.test(second)) return { platform: "youtube", handle: `@${second}`, kind: "handle" };
    return null;
  }
  if (host === "tiktok.com") {
    return first.startsWith("@") && HANDLE.test(first.slice(1)) ? { platform: "tiktok", handle: first, kind: "handle" } : null;
  }
  if (host === "instagram.com") {
    return HANDLE.test(first) ? { platform: "instagram", handle: `@${first}`, kind: "handle" } : null;
  }
  return null;
}

/**
 * Accepts what people actually paste: "@name", "name", or a profile link
 * (youtube.com/@name, youtube.com/channel/UC…, tiktok.com/@name, instagram.com/name).
 * A bare handle is assigned to `platform`; a link keeps the platform it points to.
 */
export function parseHandle(input: string, platform: LookupPlatform): ParsedHandle | null {
  const text = input.trim();
  if (!text || text.length > MAX_INPUT_LENGTH) return null;

  if (/^(https?:\/\/)?([a-z0-9-]+\.)*(youtube\.com|tiktok\.com|instagram\.com)\//i.test(text)) {
    try {
      return fromUrl(new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`));
    } catch {
      return null;
    }
  }

  if (platform === "youtube" && YT_CHANNEL_ID.test(text)) return { platform, handle: text, kind: "channelId" };
  const bare = text.replace(/^@/, "");
  return HANDLE.test(bare) ? { platform, handle: `@${bare}`, kind: "handle" } : null;
}
