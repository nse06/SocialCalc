import { describe, expect, it } from "vitest";
import { adDocument } from "./ads";

describe("adDocument", () => {
  it("wraps the official Adsterra snippet for one unit", () => {
    const html = adDocument({ key: "abc123DEF456", width: 300, height: 250 }, "www.example-ads.com");
    expect(html).toContain('atOptions = {"key":"abc123DEF456","format":"iframe","height":250,"width":300,"params":{}};');
    expect(html).toContain('src="https://www.example-ads.com/abc123DEF456/invoke.js"');
  });
});
