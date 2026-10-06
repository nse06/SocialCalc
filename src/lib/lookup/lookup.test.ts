import { describe, expect, it } from "vitest";
import { profilePrefill } from "./client";
import { parseHandle } from "./parse-handle";
import { CHANNEL, NOW, VIDEOS, fakeYouTubeApi } from "./test-fixtures";
import { LookupFailure, type ProfileStats } from "./types";
import { durationSeconds, fetchYouTubeProfile, summarizeFormat, toProfileStats, videoFormat } from "./youtube";

const DAY = 86_400_000;

describe("parseHandle", () => {
  it.each([
    ["@MrBeast", { handle: "@MrBeast", kind: "handle" }],
    ["  mrbeast ", { handle: "@mrbeast", kind: "handle" }],
    ["https://www.youtube.com/@mkbhd/videos", { handle: "@mkbhd", kind: "handle" }],
    ["youtube.com/channel/UCBJycsmduvYEL83R_U4JriQ", { handle: "UCBJycsmduvYEL83R_U4JriQ", kind: "channelId" }],
    ["UCBJycsmduvYEL83R_U4JriQ", { handle: "UCBJycsmduvYEL83R_U4JriQ", kind: "channelId" }],
    ["https://m.youtube.com/user/marquesbrownlee", { handle: "marquesbrownlee", kind: "username" }],
    ["https://www.youtube.com/c/LinusTechTips", { handle: "@LinusTechTips", kind: "handle" }],
  ])("reads %s", (input, expected) => {
    expect(parseHandle(input, "youtube")).toEqual({ platform: "youtube", ...expected });
  });

  it("keeps the platform a link points to", () => {
    expect(parseHandle("https://www.tiktok.com/@khaby.lame?lang=en", "youtube")).toEqual({
      platform: "tiktok",
      handle: "@khaby.lame",
      kind: "handle",
    });
    expect(parseHandle("instagram.com/natgeo/", "youtube")).toMatchObject({ platform: "instagram", handle: "@natgeo" });
  });

  it.each(["", "@", "a", "hello world", "https://example.com/@someone", "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "@".repeat(201)])(
    "rejects %j",
    (input) => {
      expect(parseHandle(input, "youtube")).toBeNull();
    },
  );
});

describe("YouTube stats", () => {
  it("parses ISO 8601 durations", () => {
    expect(durationSeconds("PT1M5S")).toBe(65);
    expect(durationSeconds("PT2H")).toBe(7_200);
    expect(durationSeconds("P1DT1S")).toBe(86_401);
    expect(durationSeconds("P0D")).toBe(0);
    expect(durationSeconds(undefined)).toBeNull();
    expect(durationSeconds("8 minutes")).toBeNull();
  });

  it("tells Shorts from long-form", () => {
    const base = { id: "x" };
    expect(videoFormat({ ...base, contentDetails: { duration: "PT8M30S" } })).toBe("long");
    expect(videoFormat({ ...base, contentDetails: { duration: "PT45S" } })).toBe("short");
    expect(videoFormat({ ...base, contentDetails: { duration: "PT2M30S" }, player: { embedWidth: "270", embedHeight: "480" } })).toBe(
      "short",
    );
    // Brief but horizontal: a long-form upload that happens to be short.
    expect(videoFormat({ ...base, contentDetails: { duration: "PT2M30S" }, player: { embedWidth: 480, embedHeight: 270 } })).toBe("long");
    expect(videoFormat({ ...base, contentDetails: { duration: "PT3M1S" }, player: { embedWidth: "270", embedHeight: "480" } })).toBe("long");
    expect(videoFormat({ ...base, contentDetails: { duration: "P0D" } })).toBeNull();
  });

  const sample = (days: number, views: number, engagementRate: number | null = null) => ({
    publishedAt: NOW - days * DAY,
    views,
    engagementRate,
  });

  it("uses settled, recent videos and ignores brand-new and years-old ones when it can", () => {
    const stats = summarizeFormat(
      [sample(2, 100), sample(10, 1_000, 4), sample(20, 2_000, 5), sample(40, 3_000), sample(400, 50_000)],
      NOW,
    );
    expect(stats).toEqual({ typicalViews: 2_000, engagementRate: 4.5, sampleSize: 3 });
  });

  it("takes at most the 15 most recent settled videos", () => {
    const samples = Array.from({ length: 20 }, (_, i) => sample(8 + i, i < 15 ? 1_000 : 99_000));
    expect(summarizeFormat(samples, NOW)).toMatchObject({ typicalViews: 1_000, sampleSize: 15 });
  });

  it("tops up thin samples with older, then the most settled new videos", () => {
    const stats = summarizeFormat([sample(1, 10), sample(5, 20), sample(30, 1_000), sample(300, 5_000)], NOW);
    expect(stats).toMatchObject({ typicalViews: 1_000, sampleSize: 3 });
    expect(summarizeFormat([sample(1, 10)], NOW)).toMatchObject({ typicalViews: 10, sampleSize: 1 });
    expect(summarizeFormat([], NOW)).toBeNull();
  });

  it("rounds engagement like the calculator field", () => {
    expect(summarizeFormat([sample(10, 1_000, 0.5), sample(11, 1_000, 0.6)], NOW)?.engagementRate).toBe(0.55);
    expect(summarizeFormat([sample(10, 1_000, 4.27)], NOW)?.engagementRate).toBe(4.3);
  });

  it("summarizes a channel's long-form videos and Shorts separately", () => {
    const profile = toProfileStats(CHANNEL, VIDEOS, NOW);
    expect(profile).toMatchObject({
      platform: "youtube",
      handle: "@testkitchen",
      displayName: "Test Kitchen",
      avatarUrl: "https://yt3.ggpht.com/test=s240",
      profileUrl: "https://www.youtube.com/@testkitchen",
      followers: 125_000,
      fetchedAt: new Date(NOW).toISOString(),
    });
    // Long: 40K, 30K (brief but horizontal), 52K, 61K, 38K (likes hidden) — not the new video or the old viral one.
    expect(profile.formats.long).toEqual({ typicalViews: 40_000, engagementRate: 4.2, sampleSize: 5 });
    expect(profile.formats.short).toEqual({ typicalViews: 100_000, engagementRate: 4, sampleSize: 3 });
  });

  it("handles hidden subscriber counts and channels without a handle", () => {
    const profile = toProfileStats(
      { ...CHANNEL, snippet: { title: "No Handle" }, statistics: { subscriberCount: "0", hiddenSubscriberCount: true } },
      [],
      NOW,
    );
    expect(profile.followers).toBeNull();
    expect(profile.handle).toBe("");
    expect(profile.profileUrl).toBe(`https://www.youtube.com/channel/${CHANNEL.id}`);
    expect(profile.formats).toEqual({});
  });
});

describe("fetchYouTubeProfile", () => {
  const lookup = (input: string, api = fakeYouTubeApi()) =>
    fetchYouTubeProfile(parseHandle(input, "youtube")!, { apiKey: "test-key", fetchImpl: api.fetchImpl, now: NOW });

  it("makes three 1-unit calls and returns normalized stats", async () => {
    const api = fakeYouTubeApi();
    const profile = await lookup("@testkitchen", api);
    expect(api.calls.map((url) => url.pathname)).toEqual([
      "/youtube/v3/channels",
      "/youtube/v3/playlistItems",
      "/youtube/v3/videos",
    ]);
    const [channels, playlist, videos] = api.calls.map((url) => url.searchParams);
    expect(channels.get("forHandle")).toBe("@testkitchen");
    expect(channels.get("key")).toBe("test-key");
    expect(playlist.get("playlistId")).toBe("UUabcdefghijklmnopqrstuv");
    expect(videos.get("id")?.split(",")).toHaveLength(VIDEOS.length);
    expect(videos.get("maxWidth")).toBe("480");
    expect(profile.formats.long?.typicalViews).toBe(40_000);
  });

  it("looks up channel links by id and legacy links by username", async () => {
    const byId = fakeYouTubeApi();
    await lookup("https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv", byId);
    expect(byId.calls[0].searchParams.get("id")).toBe("UCabcdefghijklmnopqrstuv");
    const byUser = fakeYouTubeApi();
    await lookup("youtube.com/user/testkitchen", byUser);
    expect(byUser.calls[0].searchParams.get("forUsername")).toBe("testkitchen");
  });

  it("reports unknown channels as not found", async () => {
    await expect(lookup("@nobody", fakeYouTubeApi({ channels: [] }))).rejects.toMatchObject({ code: "not_found" });
  });

  it("reports quota and network problems as unavailable", async () => {
    await expect(lookup("@testkitchen", fakeYouTubeApi({ status: { channels: 403 } }))).rejects.toMatchObject({
      code: "unavailable",
    });
    const offline = fetchYouTubeProfile(parseHandle("@testkitchen", "youtube")!, {
      apiKey: "k",
      fetchImpl: () => Promise.reject(new TypeError("fetch failed")),
    });
    await expect(offline).rejects.toBeInstanceOf(LookupFailure);
  });

  it("still returns subscribers for a channel without uploads", async () => {
    const api = fakeYouTubeApi({ status: { playlistItems: 404 } });
    const profile = await lookup("@testkitchen", api);
    expect(profile.followers).toBe(125_000);
    expect(profile.formats).toEqual({});
    expect(api.calls).toHaveLength(2);
  });
});

describe("profilePrefill", () => {
  const profile: ProfileStats = toProfileStats(CHANNEL, VIDEOS, NOW);

  it("fills followers, views and engagement from the matching format", () => {
    expect(profilePrefill(profile, "integration")).toEqual({
      format: "long",
      stats: profile.formats.long,
      patch: { followers: 125_000, views: 40_000, viewsUnknown: false, engagementRate: 4.2, engagementSkipped: false },
    });
    expect(profilePrefill(profile, "short").patch).toMatchObject({ views: 100_000, engagementRate: 4 });
  });

  it("only fills what it knows", () => {
    const shortsOnly: ProfileStats = { ...profile, formats: { short: profile.formats.short! } };
    expect(profilePrefill(shortsOnly, "dedicated")).toEqual({ format: "long", stats: null, patch: { followers: 125_000 } });
    expect(profilePrefill({ ...profile, followers: null }, "short").patch).not.toHaveProperty("followers");
  });
});
