import { describe, expect, it } from "vitest";

import { sanitiseHttpsUrl } from "@/lib/utils/url";

describe("sanitiseHttpsUrl", () => {
  it("allows valid https and http URLs", () => {
    expect(sanitiseHttpsUrl("https://example.com/news/1")).toBe("https://example.com/news/1");
    expect(sanitiseHttpsUrl("http://example.org/page")).toBe("http://example.org/page");
  });

  it("rejects javascript:, data:, and other non-http protocols", () => {
    expect(sanitiseHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(sanitiseHttpsUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(sanitiseHttpsUrl("file:///etc/passwd")).toBeNull();
    expect(sanitiseHttpsUrl("mailto:test@example.com")).toBeNull();
  });

  it("handles null, undefined, empty, and malformed strings safely", () => {
    expect(sanitiseHttpsUrl(null)).toBeNull();
    expect(sanitiseHttpsUrl(undefined)).toBeNull();
    expect(sanitiseHttpsUrl("")).toBeNull();
    expect(sanitiseHttpsUrl("not a url")).toBeNull();
  });
});
