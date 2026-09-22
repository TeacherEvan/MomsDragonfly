/**
 * Install-environment detection for the PWA install banner.
 *
 * Why this exists: on Android, an installed PWA is packaged as a "WebAPK" app
 * by whichever browser performs the install. Samsung Internet and several OEM
 * browsers mint WebAPKs with an outdated targetSdkVersion, which Android 14+
 * blocks via Google Play Protect ("built for an older version of Android and
 * doesn't include the latest privacy protections"). Chrome's minting service
 * is current, so non-Chrome Android browsers are routed to Chrome instead of
 * being offered a local install.
 */

export type InstallRoute =
  | "installed" // already running as the installed app
  | "chrome-android" // Chrome on Android — native install flow is safe
  | "desktop-chromium" // desktop Chromium browsers — native install flow is safe
  | "other-android" // non-Chrome Android browser — route to Chrome
  | "ios-safari" // iOS Safari — manual "Add to Home Screen" instructions
  | "ios-other" // other iOS browser — send to Safari for install
  | "unsupported"; // no install path offered

export interface InstallEnvironmentInput {
  userAgent: string;
  /** Running as the installed app: matchMedia("(display-mode: standalone)") or iOS navigator.standalone. */
  standalone: boolean;
  /** navigator.maxTouchPoints — used to catch iPadOS, which sends a desktop macOS UA. */
  maxTouchPoints?: number;
}

/**
 * Browsers on Android whose WebAPK minting is known (or very likely) stale,
 * or that cannot install a proper WebAPK at all. Conservative by design:
 * anything that is not clean Chrome gets routed to Chrome.
 */
const ANDROID_BROWSER_DENY = [
  "SamsungBrowser", // Samsung Internet — documented Play Protect block
  "MiuiBrowser",
  "HuaweiBrowser",
  "HeyTapBrowser",
  "OppoBrowser",
  "VivoBrowser",
  "EdgA", // Edge for Android
  "OPR",
  "Opera",
  "Firefox", // no WebAPK support (shortcut only)
  "wv", // Android WebView / in-app browsers
  "Version/4.0", // legacy WebView marker used by many in-app/OEM browsers
  "UCBrowser",
  "QQBrowser",
  "DuckDuckGo",
  "Brave",
  "Vivaldi",
] as const;

export function classifyInstallEnvironment({
  userAgent,
  standalone,
  maxTouchPoints,
}: InstallEnvironmentInput): InstallRoute {
  if (standalone) return "installed";

  const ua = userAgent;

  // iPadOS 13+ sends a desktop macOS UA; touch support disambiguates it.
  const isIpadOs = /Macintosh/i.test(ua) && (maxTouchPoints ?? 0) > 1;
  const isIos = /iPhone|iPad|iPod/i.test(ua) || isIpadOs;

  if (isIos) {
    const isSafari =
      /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua);
    return isSafari ? "ios-safari" : "ios-other";
  }

  if (/Android/i.test(ua)) {
    const isPureChrome =
      /Chrome\//.test(ua) && !ANDROID_BROWSER_DENY.some((token) => ua.includes(token));
    return isPureChrome ? "chrome-android" : "other-android";
  }

  if (/Chrome\/|Chromium\/|Edg\/|OPR\//.test(ua)) return "desktop-chromium";
  return "unsupported";
}

/** Build an Android intent:// URL that opens the given https URL in Chrome (with a fallback to the current browser). */
export function buildChromeIntentUrl(href: string): string {
  const url = new URL(href);
  const scheme = url.protocol.replace(":", "");
  const fallback = encodeURIComponent(href);
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
}
