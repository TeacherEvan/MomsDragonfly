import { describe, expect, it } from "vitest";

import { fallbackPhrases, parsePhraseResponse } from "../../convex/phraseHelpers";

describe("phraseHelpers", () => {
  it("parses valid JSON response with language and phrases", () => {
    const raw = JSON.stringify({
      language: "Afrikaans",
      phrases: [
        { local: "Dankie", roman: "DUNK-ee", english: "Thank you", note: "Polite" },
      ],
    });
    const parsed = parsePhraseResponse(raw);
    expect(parsed?.language).toBe("Afrikaans");
    expect(parsed?.phrases).toHaveLength(1);
    expect(parsed?.phrases[0].local).toBe("Dankie");
  });

  it("handles markdown code fences and surrounding prose", () => {
    const raw = "Here are phrases:\n```json\n{\"language\":\"Thai\",\"phrases\":[{\"local\":\"ขอบคุณ\",\"roman\":\"khop-khun\",\"english\":\"Thank you\",\"note\":\"Everyday\"}]}\n```";
    const parsed = parsePhraseResponse(raw);
    expect(parsed?.language).toBe("Thai");
    expect(parsed?.phrases[0].english).toBe("Thank you");
  });

  it("returns null on garbage input or missing required fields", () => {
    expect(parsePhraseResponse("")).toBeNull();
    expect(parsePhraseResponse("invalid json")).toBeNull();
    expect(parsePhraseResponse(JSON.stringify({ language: "Test", phrases: [{ local: "A" }] }))).toBeNull();
  });

  it("matches Pretoria and South Africa to Afrikaans fallback", () => {
    const res = fallbackPhrases("Pretoria", "South Africa");
    expect(res.language).toBe("Afrikaans");
    expect(res.phrases.length).toBe(10);
    expect(res.phrases[0].local).toBe("Hallo");
  });

  it("matches Bangkok and Thailand to Thai fallback", () => {
    const res = fallbackPhrases("Bangkok", "Thailand");
    expect(res.language).toBe("Thai");
    expect(res.phrases.length).toBe(10);
    expect(res.phrases[0].local).toBe("สวัสดี");
  });

  it("returns empty phrases for unknown locations", () => {
    const res = fallbackPhrases("Unknown City", "Unknown Country");
    expect(res.language).toBeNull();
    expect(res.phrases).toEqual([]);
  });
});
