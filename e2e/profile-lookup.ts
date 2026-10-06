import type { Page } from "@playwright/test";

// `npm run test:e2e` builds with NEXT_PUBLIC_FEATURE_PROFILE_LOOKUP=true; the endpoint itself is mocked.
export const LOOKUP_PROFILE = {
  platform: "youtube",
  handle: "@testkitchen",
  displayName: "Test Kitchen",
  profileUrl: "https://www.youtube.com/@testkitchen",
  followers: 125_000,
  formats: {
    long: { typicalViews: 40_000, engagementRate: 4.2, sampleSize: 5 },
    short: { typicalViews: 100_000, engagementRate: 4, sampleSize: 3 },
  },
  fetchedAt: "2026-10-06T12:00:00.000Z",
};

/** Answers /api/profile with `body`, recording each request. */
export async function mockProfileLookup(page: Page, status = 200, body: object = LOOKUP_PROFILE) {
  const requests: URL[] = [];
  await page.route(
    (url) => url.pathname === "/api/profile",
    (route) => {
      requests.push(new URL(route.request().url()));
      return route.fulfill({ status, json: body });
    },
  );
  return requests;
}
