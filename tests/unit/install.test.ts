import { describe, it, expect } from "vitest";
import {
  buildChromeIntentUrl,
  classifyInstallEnvironment,
} from "@/lib/utils/install";

const UA = {
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 15; 23090RA98G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.58 Mobile Safari/537.36",
  samsungInternet:
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",
  miuiBrowser:
    "Mozilla/5.0 (Linux; U; Android 13; en-gb; 22101316G Build/TKQ1) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.5481.153 Mobile Safari/537.36 XiaoMi/MiuiBrowser/17.3.8",
  edgeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36 EdgA/125.0.2535.93",
  firefoxAndroid:
    "Mozilla/5.0 (Android 14; Mobile; rv:126.0) Gecko/126.0 Firefox/126.0",
  inAppWebView:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/125.0.6422.147 Mobile Safari/537.36",
  iosSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iosChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1",
  ipadDesktopMode:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  desktopChrome:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.58 Safari/537.36",
  desktopEdge:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  desktopSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  desktopFirefox:
    "Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
};

const classify = (ua: string, standalone = false, maxTouchPoints = 0) =>
  classifyInstallEnvironment({ userAgent: ua, standalone, maxTouchPoints });

describe("classifyInstallEnvironment", () => {
  it("marks the installed app first", () => {
    expect(classify(UA.chromeAndroid, true)).toBe("installed");
    expect(classify(UA.iosSafari, true)).toBe("installed");
  });

  it("allows pure Chrome on Android", () => {
    expect(classify(UA.chromeAndroid)).toBe("chrome-android");
  });

  it("routes Samsung Internet to Chrome (stale WebAPK minting)", () => {
    expect(classify(UA.samsungInternet)).toBe("other-android");
  });

  it("routes OEM browsers (MIUI) to Chrome", () => {
    expect(classify(UA.miuiBrowser)).toBe("other-android");
  });

  it("routes Edge for Android to Chrome", () => {
    expect(classify(UA.edgeAndroid)).toBe("other-android");
  });

  it("routes Firefox Android to Chrome (no WebAPK support)", () => {
    expect(classify(UA.firefoxAndroid)).toBe("other-android");
  });

  it("routes in-app WebViews to Chrome", () => {
    expect(classify(UA.inAppWebView)).toBe("other-android");
  });

  it("detects iOS Safari for Add to Home Screen instructions", () => {
    expect(classify(UA.iosSafari)).toBe("ios-safari");
  });

  it("sends other iOS browsers to Safari", () => {
    expect(classify(UA.iosChrome)).toBe("ios-other");
  });

  it("detects iPadOS desktop-mode via touch points", () => {
    expect(classify(UA.ipadDesktopMode, false, 5)).toBe("ios-safari");
    expect(classify(UA.ipadDesktopMode, false, 0)).toBe("unsupported");
  });

  it("allows desktop Chromium browsers", () => {
    expect(classify(UA.desktopChrome)).toBe("desktop-chromium");
    expect(classify(UA.desktopEdge)).toBe("desktop-chromium");
  });

  it("offers no install path on desktop Safari/Firefox", () => {
    expect(classify(UA.desktopSafari)).toBe("unsupported");
    expect(classify(UA.desktopFirefox)).toBe("unsupported");
  });
});

describe("buildChromeIntentUrl", () => {
  it("builds an intent link that opens Chrome with a fallback", () => {
    expect(buildChromeIntentUrl("https://mom-s-dragonfly.vercel.app/")).toBe(
      "intent://mom-s-dragonfly.vercel.app/#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fmom-s-dragonfly.vercel.app%2F;end"
    );
  });

  it("keeps path and query string", () => {
    const url = buildChromeIntentUrl(
      "https://mom-s-dragonfly.vercel.app/explore?lat=-25.75"
    );
    expect(url).toContain("intent://mom-s-dragonfly.vercel.app/explore?lat=-25.75#Intent;");
    expect(url).toContain(
      "S.browser_fallback_url=https%3A%2F%2Fmom-s-dragonfly.vercel.app%2Fexplore%3Flat%3D-25.75"
    );
  });
});
