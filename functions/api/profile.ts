/**
 * GET /api/profile?platform=youtube&handle=@name
 *
 * Cloudflare Pages Function that looks up a creator's public stats so the
 * calculator can fill them in. The API key never reaches the browser: set
 * YOUTUBE_API_KEY as an encrypted environment variable in Cloudflare Pages.
 * Results are cached at the edge per handle, which keeps repeat lookups free
 * and the daily API quota intact.
 */
import { parseHandle } from "../../src/lib/lookup/parse-handle";
import { type LookupError, type LookupErrorCode, LookupFailure } from "../../src/lib/lookup/types";
import { fetchYouTubeProfile } from "../../src/lib/lookup/youtube";

interface Env {
  YOUTUBE_API_KEY?: string;
}

/** The parts of Cloudflare's EventContext this function uses. */
export interface PagesContext {
  request: Request;
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}

const FOUND_TTL = 12 * 60 * 60;
/** Misses are remembered briefly so retyping a wrong handle doesn't spend quota. */
const NOT_FOUND_TTL = 10 * 60;

const STATUS: Record<LookupErrorCode, number> = {
  invalid_handle: 400,
  unsupported: 400,
  not_found: 404,
  unavailable: 503,
};

function json(body: unknown, status: number, ttl = 0): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": ttl ? `public, max-age=${ttl}` : "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function failure(error: LookupErrorCode, message: string, ttl = 0): Response {
  return json({ error, message } satisfies LookupError, STATUS[error], ttl);
}

/** Cloudflare's default cache; absent when running outside Workers. */
function edgeCache(): Cache | null {
  return (globalThis as { caches?: { default?: Cache } }).caches?.default ?? null;
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  const platform = url.searchParams.get("platform");
  if (platform !== "youtube") return failure("unsupported", "Profile lookup only supports YouTube for now.");
  const parsed = parseHandle(url.searchParams.get("handle") ?? "", platform);
  if (!parsed || parsed.platform !== platform) {
    return failure("invalid_handle", "That doesn't look like a YouTube handle or channel link.");
  }
  if (!env.YOUTUBE_API_KEY) return failure("unavailable", "Profile lookup isn't set up yet.");

  // Handles and usernames are case-insensitive; channel ids are not.
  const id = parsed.kind === "channelId" ? parsed.handle : parsed.handle.toLowerCase();
  const cacheKey = new Request(`${url.origin}/api/profile/${parsed.platform}/${parsed.kind}/${encodeURIComponent(id)}`);
  const cache = edgeCache();
  const cached = await cache?.match(cacheKey);
  if (cached) return cached;

  let response: Response;
  try {
    const profile = await fetchYouTubeProfile(parsed, { apiKey: env.YOUTUBE_API_KEY, fetchImpl: (input) => fetch(input) });
    response = json(profile, 200, FOUND_TTL);
  } catch (error) {
    const known = error instanceof LookupFailure ? error : null;
    const code = known?.code ?? "unavailable";
    response = failure(code, known?.message ?? "Profile lookup isn't available right now.", code === "not_found" ? NOT_FOUND_TTL : 0);
  }
  if (cache && (response.ok || response.status === 404)) context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
