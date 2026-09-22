"use client";
import React, { useEffect, useState } from "react";
import {
  buildChromeIntentUrl,
  classifyInstallEnvironment,
  type InstallRoute,
} from "@/lib/utils/install";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "mdf_install_dismissed";
const DISMISS_DAYS = 7;
/** Non-event routes (Chrome nudge / iOS instructions) appear after a short delay, not instantly. */
const NUDGE_DELAY_MS = 6_000;

export function InstallPrompt() {
  const [route, setRoute] = useState<InstallRoute | null>(null);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (
      dismissed &&
      Date.now() - parseInt(dismissed, 10) < DISMISS_DAYS * 86_400_000
    ) {
      return;
    }

    const env = classifyInstallEnvironment({
      userAgent: navigator.userAgent,
      standalone:
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true,
      maxTouchPoints: navigator.maxTouchPoints,
    });
    setRoute(env);
    if (env === "installed") return;

    let timer: number | undefined;
    if (env === "other-android" || env === "ios-safari" || env === "ios-other") {
      timer = window.setTimeout(() => setVisible(true), NUDGE_DELAY_MS);
    }

    const onPrompt = (e: Event) => {
      const installable = env === "chrome-android" || env === "desktop-chromium";
      if (!installable) {
        // Non-Chrome Android browsers mint stale WebAPKs that Play Protect
        // blocks — never offer their install, we route to Chrome instead.
        if (env === "other-android") e.preventDefault();
        return;
      }
      e.preventDefault();
      if (timer) window.clearTimeout(timer);
      setPromptEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      if (timer) window.clearTimeout(timer);
      setVisible(false);
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    setVisible(false);
  };

  const dismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setVisible(false);
  };

  if (!visible || !route) return null;

  const chromeIntentUrl =
    route === "other-android" && typeof window !== "undefined"
      ? buildChromeIntentUrl(window.location.href)
      : null;

  const isIos = route === "ios-safari" || route === "ios-other";

  return (
    <aside
      aria-label="PWA install banner"
      className="fixed top-16 inset-x-4 max-w-md mx-auto z-50 bg-primary-500/95 backdrop-blur-sm text-dragonfly-navy-950 px-4 py-3 rounded-2xl shadow-strong flex items-center justify-between gap-3 border border-primary-500/30 animate-slide-up"
    >
      {route === "other-android" && chromeIntentUrl ? (
        <>
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden="true">🌐</span>
            <div className="text-caption">
              <p className="font-bold">Open in Chrome to install</p>
              <p className="text-primary-500/80 leading-snug">
                Android blocks installs from this browser — Chrome installs
                Dragonfly properly in seconds.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={chromeIntentUrl}
              className="px-3 py-1.5 bg-dragonfly-navy-950 hover:bg-dragonfly-navy-800 text-primary-500 rounded-lg text-caption font-bold shadow-glow transition-colors duration-fast"
            >
              Open Chrome
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="text-primary-500/70 hover:text-primary-500 p-1 text-sm font-bold transition-colors duration-fast"
              aria-label="Dismiss install banner"
            >
              ✕
            </button>
          </div>
        </>
      ) : isIos ? (
        <>
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden="true">📲</span>
            <div className="text-caption">
              <p className="font-bold">Add Dragonfly to your Home Screen</p>
              <p className="text-primary-500/80 leading-snug">
                {route === "ios-safari"
                  ? "Tap the Share button, then choose “Add to Home Screen”."
                  : "Open this page in Safari, tap Share, then “Add to Home Screen”."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="text-primary-500/70 hover:text-primary-500 p-1 text-sm font-bold transition-colors duration-fast shrink-0"
            aria-label="Dismiss install banner"
          >
            ✕
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden="true">📲</span>
            <div className="text-caption">
              <p className="font-bold">Add Mom&apos;s Dragonfly</p>
              <p className="text-primary-500/80">Install to your home screen for quick offline access</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={install}
              className="px-3 py-1.5 bg-dragonfly-navy-950 hover:bg-dragonfly-navy-800 text-primary-500 rounded-lg text-caption font-bold shadow-glow transition-colors duration-fast"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-primary-500/70 hover:text-primary-500 p-1 text-sm font-bold transition-colors duration-fast"
              aria-label="Dismiss install banner"
            >
              ✕
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
