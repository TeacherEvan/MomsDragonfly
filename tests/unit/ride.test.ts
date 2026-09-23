import { describe, it, expect } from "vitest";
import {
  buildBoltLaunch,
  buildMapsUrl,
  buildDestinationText,
} from "@/lib/ride/links";

const ANDROID_CHROME_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const ANDROID_SAMSUNG_UA =
  "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36";
const ANDROID_FIREFOX_UA =
  "Mozilla/5.0 (Android 14; Mobile; rv:127.0) Gecko/127.0 Firefox/127.0";
const IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const dest = {
  name: "Safari Pantry",
  lat: -25.7461,
  lng: 28.237,
  address: "867 Cliffendale Dr",
};

describe("buildBoltLaunch", () => {
  it("launches the Bolt app on Android Chromium browsers", () => {
    for (const ua of [ANDROID_CHROME_UA, ANDROID_SAMSUNG_UA]) {
      const launch = buildBoltLaunch(ua);
      expect(launch.mode).toBe("app");
      expect(launch.href).toContain("intent://bolt.eu/#Intent;");
      expect(launch.href).toContain("package=ee.mtakso.client");
      expect(launch.href).toContain("S.browser_fallback_url=https%3A%2F%2Fbolt.eu%2F");
      expect(launch.href.endsWith(";end")).toBe(true);
    }
  });

  it("falls back to the Bolt website on iOS (AASA has no applinks claim)", () => {
    expect(buildBoltLaunch(IOS_UA)).toEqual({ href: "https://bolt.eu/", mode: "web" });
  });

  it("falls back to the Bolt website on desktop", () => {
    expect(buildBoltLaunch(DESKTOP_UA)).toEqual({ href: "https://bolt.eu/", mode: "web" });
  });

  it("falls back to the Bolt website on Android Firefox and empty UA", () => {
    expect(buildBoltLaunch(ANDROID_FIREFOX_UA)).toEqual({ href: "https://bolt.eu/", mode: "web" });
    expect(buildBoltLaunch("")).toEqual({ href: "https://bolt.eu/", mode: "web" });
  });
});

describe("buildMapsUrl", () => {
  it("includes a prefilled destination", () => {
    const url = buildMapsUrl(dest);
    expect(url).toContain("destination=-25.7461%2C28.237");
    expect(url).toContain("travelmode=driving");
    expect(url).not.toContain("origin=");
  });

  it("includes pickup when provided", () => {
    const url = buildMapsUrl(dest, { lat: -25.75, lng: 28.24 });
    expect(url).toContain("origin=-25.75%2C28.24");
  });
});

describe("buildDestinationText", () => {
  it("joins name, address and coordinates", () => {
    expect(buildDestinationText(dest)).toBe(
      "Safari Pantry — 867 Cliffendale Dr — -25.74610, 28.23700"
    );
  });

  it("skips missing address", () => {
    expect(buildDestinationText({ name: "X", lat: 1, lng: 2 })).toBe(
      "X — 1.00000, 2.00000"
    );
  });
});