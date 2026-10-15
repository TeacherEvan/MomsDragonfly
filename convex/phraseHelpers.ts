import { MAX_PHRASES } from "./limits";

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

const AFRIKAANS_PHRASES: PhraseItem[] = [
  { local: "Hallo", roman: "Hallo", english: "Hello", note: "Any time of day" },
  { local: "Goeie môre", roman: "GOO-ee-uh MORE-uh", english: "Good morning", note: "Before ~11:00" },
  { local: "Dankie", roman: "DUNK-ee", english: "Thank you", note: "The one you'll use most" },
  { local: "Asseblief", roman: "AH-suh-bleef", english: "Please", note: "Also 'you're welcome'" },
  { local: "Totsiens", roman: "TOT-seens", english: "Goodbye", note: "On leaving" },
  { local: "Verskoon my", roman: "fer-SKOHN may", english: "Excuse me", note: "Getting attention or passing through" },
  { local: "Hoe gaan dit?", roman: "hoo KHAN dit", english: "How are you?", note: "Friendly greeting" },
  { local: "Ek verstaan nie", roman: "ek fer-STAHN nee", english: "I don't understand", note: "When it's too fast" },
  { local: "Praat jy Engels?", roman: "praht yay ENG-uls", english: "Do you speak English?", note: "Ask before switching" },
  { local: "Hoeveel kos dit?", roman: "HOO-fel kos dit", english: "How much does this cost?", note: "Markets and taxis" },
];

const THAI_PHRASES: PhraseItem[] = [
  { local: "สวัสดี", roman: "sà-wàt-dee", english: "Hello", note: "Works any time of day" },
  { local: "ขอบคุณ", roman: "khàawp-khun", english: "Thank you", note: "Add 'khráp'/'khâ' for politeness" },
  { local: "ขอโทษ", roman: "khǎaw-thôot", english: "Sorry, excuse me", note: "Apologies or getting attention" },
  { local: "ใช่", roman: "châi", english: "Yes", note: "Confirming" },
  { local: "ไม่", roman: "mâi", english: "No", note: "Declining" },
  { local: "ไม่เป็นไร", roman: "mâi bpen rai", english: "It's okay, no worries", note: "The all-purpose reply" },
  { local: "เท่าไหร่", roman: "thâo-rài", english: "How much is it?", note: "Street food and markets" },
  { local: "แพงไป", roman: "phaeng bpai", english: "Too expensive", note: "Gentle bargaining" },
  { local: "ไม่เข้าใจ", roman: "mâi khâo-jai", english: "I don't understand", note: "When Thai comes fast" },
  { local: "พูดภาษาอังกฤษได้ไหม", roman: "phûut phaa-sǎa ang-grìt dâi mǎi", english: "Do you speak English?", note: "Ask before switching" },
];

/** Tolerant parser for Gemini phrase response. */
export function parsePhraseResponse(raw: string): { language: string | null; phrases: PhraseItem[] } | null {
  if (!raw || typeof raw !== "string") return null;

  // Clean markdown code blocks
  const text = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  // Try extracting JSON object
  const startObj = text.indexOf("{");
  const endObj = text.lastIndexOf("}");
  if (startObj !== -1 && endObj > startObj) {
    try {
      const parsed = JSON.parse(text.slice(startObj, endObj + 1)) as {
        language?: string;
        phrases?: unknown[];
      };
      const language = typeof parsed.language === "string" ? parsed.language.trim() : null;
      if (Array.isArray(parsed.phrases)) {
        const phrases = sanitizePhraseItems(parsed.phrases);
        if (phrases.length > 0) {
          return { language, phrases: phrases.slice(0, MAX_PHRASES) };
        }
      }
    } catch {
      // fallback to array parse
    }
  }

  // Try extracting JSON array if format was array
  const startArr = text.indexOf("[");
  const endArr = text.lastIndexOf("]");
  if (startArr !== -1 && endArr > startArr) {
    try {
      const parsed = JSON.parse(text.slice(startArr, endArr + 1)) as unknown[];
      const phrases = sanitizePhraseItems(parsed);
      if (phrases.length > 0) {
        return { language: null, phrases: phrases.slice(0, MAX_PHRASES) };
      }
    } catch {
      return null;
    }
  }

  return null;
}

function sanitizePhraseItems(items: unknown[]): PhraseItem[] {
  const result: PhraseItem[] = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const { local, roman, english, note } = item as Record<string, unknown>;
    if (
      typeof local === "string" && local.trim() &&
      typeof roman === "string" && roman.trim() &&
      typeof english === "string" && english.trim() &&
      typeof note === "string" && note.trim()
    ) {
      result.push({
        local: local.trim(),
        roman: roman.trim(),
        english: english.trim(),
        note: note.trim(),
      });
    }
  }
  return result;
}

/** Fallback curated phrases when AI is offline or unavailable. */
export function fallbackPhrases(
  areaName: string | null,
  country: string | null
): { language: string | null; phrases: PhraseItem[] } {
  const target = `${areaName ?? ""} ${country ?? ""}`.toLowerCase();

  if (/pretoria|tshwane|johannesburg|south africa|gauteng|cape town/i.test(target)) {
    return { language: "Afrikaans", phrases: AFRIKAANS_PHRASES };
  }

  if (/bangkok|thailand|chiang mai|phuket|pattaya/i.test(target)) {
    return { language: "Thai", phrases: THAI_PHRASES };
  }

  return { language: null, phrases: [] };
}
