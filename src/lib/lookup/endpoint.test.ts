/**
 * The Cloudflare Pages Function behind /api/profile. (Tests can't live in
 * functions/ — every file there becomes a route.)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type PagesContext, onRequestGet } from "../../../functions/api/profile";
import { fakeYouTubeApi } from "./test-fixtures";

let store: Map<string, Response>;
let api: ReturnType<typeof fakeYouTubeApi>;

function stubUpstream(options?: Parameters<typeof fakeYouTubeApi>[0]) {
  api = fakeYouTubeApi(options);
  vi.stubGlobal("fetch", vi.fn((input: string) => api.fetchImpl(input)));
}

beforeEach(() => {
  store = new Map();
  vi.stubGlobal("caches", {
    default: {
      match: async (request: Request) => store.get(request.url)?.clone(),
      put: async (request: Request, response: Response) => void store.set(request.url, response),
    },
  });
  stubUpstream();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function get(query: string, env: PagesContext["env"] = { YOUTUBE_API_KEY: "test-key" }) {
  const pending: Promise<unknown>[] = [];
  const response = await onRequestGet({
    request: new Request(`https://example.com/api/profile?${query}`),
    env,
    waitUntil: (promise) => void pending.push(promise),
  });
  await Promise.all(pending);
  return { response, body: await response.json() };
}

describe("/api/profile", () => {
  it("returns normalized stats and caches them per handle", async () => {
    const first = await get("platform=youtube&handle=%40testkitchen");
    expect(first.response.status).toBe(200);
    expect(first.response.headers.get("Cache-Control")).toBe("public, max-age=43200");
    expect(first.body).toMatchObject({ platform: "youtube", handle: "@testkitchen", followers: 125_000 });
    expect(first.body).not.toHaveProperty("key");
    expect(api.calls).toHaveLength(3);

    // Same channel, different spelling: served from the edge cache.
    const second = await get("platform=youtube&handle=https%3A%2F%2Fwww.youtube.com%2F%40TestKitchen");
    expect(second.body).toEqual(first.body);
    expect(api.calls).toHaveLength(3);
  });

  it("rejects unsupported platforms and malformed handles without calling YouTube", async () => {
    expect((await get("platform=instagram&handle=natgeo")).response.status).toBe(400);
    const bad = await get("platform=youtube&handle=not%20a%20handle");
    expect(bad.response.status).toBe(400);
    expect(bad.body.error).toBe("invalid_handle");
    // A link to another platform isn't a YouTube channel.
    expect((await get("platform=youtube&handle=tiktok.com%2F%40someone")).body.error).toBe("invalid_handle");
    expect(api.calls).toHaveLength(0);
  });

  it("is unavailable until the API key is configured", async () => {
    const { response, body } = await get("platform=youtube&handle=testkitchen", {});
    expect(response.status).toBe(503);
    expect(body.error).toBe("unavailable");
    expect(api.calls).toHaveLength(0);
  });

  it("remembers misses briefly but never caches outages", async () => {
    stubUpstream({ channels: [] });
    const miss = await get("platform=youtube&handle=nobody");
    expect(miss.response.status).toBe(404);
    expect(miss.response.headers.get("Cache-Control")).toBe("public, max-age=600");
    expect(store.size).toBe(1);

    stubUpstream({ status: { channels: 403 } });
    const outage = await get("platform=youtube&handle=testkitchen");
    expect(outage.response.status).toBe(503);
    expect(outage.response.headers.get("Cache-Control")).toBe("no-store");
    expect(outage.body).toEqual({ error: "unavailable", message: "YouTube lookups aren't available right now." });
    expect(store.size).toBe(1);
  });
});
