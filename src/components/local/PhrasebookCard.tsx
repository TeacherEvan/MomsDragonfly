"use client";
import { useCallback, useState } from "react";

import { api } from "@/app/providers";
import { useToast } from "@/components/shell/Toast";
import { Icon } from "@/components/ui/Icon";
import { useActionData } from "@/hooks/useActionData";
import { copyText } from "@/lib/utils/clipboard";
import { getDeviceId } from "@/lib/utils/deviceId";

export interface PhraseItem {
  local: string;
  roman: string;
  english: string;
  note: string;
}

export interface PhrasesPayload {
  areaName: string | null;
  language: string | null;
  phrases: PhraseItem[];
  fetchedAt: number;
}

interface PhrasebookCardProps {
  lat: number;
  lng: number;
}

const BCP47_MAP: Record<string, string> = {
  afrikaans: "af",
  thai: "th",
  english: "en",
  french: "fr",
  spanish: "es",
  german: "de",
  italian: "it",
  portuguese: "pt",
  dutch: "nl",
  japanese: "ja",
  chinese: "zh",
};

function getBcp47(lang: string | null): string | undefined {
  if (!lang) return undefined;
  const lower = lang.trim().toLowerCase();
  return BCP47_MAP[lower] ?? (lower.length === 2 || lower.length === 3 ? lower : undefined);
}

function PhraseRow({ phrase, language }: { phrase: PhraseItem; language: string | null }) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const bcp47 = getBcp47(language);

  const handleCopy = useCallback(async () => {
    const textToCopy = `${phrase.local} (${phrase.roman}) — ${phrase.english}`;
    const ok = await copyText(textToCopy);
    if (ok) {
      setCopied(true);
      showToast({ message: `Copied "${phrase.local}"`, type: "success" });
      setTimeout(() => setCopied(false), 2000);
    }
  }, [phrase, showToast]);

  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-dragonfly-navy-800 bg-dragonfly-navy-950/60 p-3 transition-colors hover:border-dragonfly-navy-700">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className="text-body font-bold text-dragonfly-navy-50"
            {...(bcp47 ? { lang: bcp47 } : {})}
          >
            {phrase.local}
          </span>
          <span className="text-caption font-medium text-dragonfly-teal-300">
            /{phrase.roman}/
          </span>
        </div>
        <p className="mt-1 text-body text-dragonfly-navy-200">{phrase.english}</p>
        {phrase.note ? (
          <p className="mt-0.5 text-caption text-dragonfly-navy-400 italic">{phrase.note}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy phrase ${phrase.local}`}
        title={`Copy ${phrase.local}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dragonfly-navy-700 bg-dragonfly-navy-900 text-dragonfly-navy-300 transition-colors hover:border-dragonfly-teal-500/40 hover:text-dragonfly-teal-300 focus:outline-none focus:ring-2 focus:ring-dragonfly-teal-500 min-h-[44px] min-w-[44px]"
      >
        <Icon
          name={copied ? "check" : "copy"}
          size={18}
          className={copied ? "text-dragonfly-emerald-400" : undefined}
        />
      </button>
    </li>
  );
}

/** 10 essential everyday local phrases, cached per area with offline fallbacks. */
export function PhrasebookCard({ lat, lng }: PhrasebookCardProps) {
  const { data, loading, failed, reload } = useActionData<
    { deviceId: string; lat: number; lng: number },
    PhrasesPayload
  >(
    api.actions.getLocalPhrases,
    { deviceId: getDeviceId(), lat, lng },
    { roundCoords: 1 }
  );

  if (loading && !data) {
    return (
      <div
        className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 p-4 space-y-3"
        role="status"
        aria-label="Loading local phrases"
      >
        <div className="h-5 w-48 animate-pulse rounded bg-dragonfly-navy-800" />
        <div className="h-4 w-64 animate-pulse rounded bg-dragonfly-navy-800/60" />
        <div className="space-y-2 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-dragonfly-navy-800/40" />
          ))}
        </div>
      </div>
    );
  }

  if (failed && (!data || data.phrases.length === 0)) {
    return (
      <section
        className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 backdrop-blur-sm p-4 text-center shadow-soft"
        aria-label="Local phrasebook"
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <Icon name="message" size={24} className="text-dragonfly-teal-400" />
          <p className="text-body font-semibold text-dragonfly-navy-200">
            Local phrases unavailable offline
          </p>
          <p className="text-caption text-dragonfly-navy-400 max-w-xs">
            Connect to the internet to load essential everyday travel phrases for this area.
          </p>
          <button
            type="button"
            onClick={reload}
            className="mt-1 px-3 py-1.5 bg-dragonfly-teal-500/20 text-dragonfly-teal-300 hover:bg-dragonfly-teal-500/30 rounded-lg text-caption font-semibold transition-colors min-h-[var(--touch-target)]"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!data || data.phrases.length === 0) return null;

  const headerTitle = data.language
    ? `Essential ${data.language}`
    : `Phrases in ${data.areaName ?? "the area"}`;

  return (
    <section
      className="rounded-xl border border-dragonfly-navy-800 bg-surface-900/70 backdrop-blur-sm p-4 shadow-soft"
      aria-label="Everyday local phrases"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="message" size={18} className="text-dragonfly-teal-400" />
          <h2 className="font-bold text-dragonfly-navy-50 text-body">{headerTitle}</h2>
        </div>
        {data.areaName && (
          <span className="inline-flex items-center gap-1 rounded-full bg-dragonfly-teal-500/15 px-2.5 py-1 text-caption font-medium text-dragonfly-teal-400">
            <Icon name="map-pin" size={12} />
            {data.areaName}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-caption text-dragonfly-navy-500">
        Everyday words &amp; how to say them
      </p>

      <ul className="mt-3 space-y-2.5">
        {data.phrases.map((phrase, idx) => (
          <PhraseRow
            key={`${phrase.local}-${idx}`}
            phrase={phrase}
            language={data.language}
          />
        ))}
      </ul>
    </section>
  );
}
