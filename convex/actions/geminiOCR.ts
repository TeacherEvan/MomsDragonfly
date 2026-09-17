import { action } from "../_generated/server";
import { v } from "convex/values";

export const geminiOCR = action({
  args: {
    imageBase64: v.string(),
    mimeType: v.string(),
  },
  handler: async (_ctx, { imageBase64, mimeType }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not set — returning mock parse text");
      return { text: "Receipt\nTotal: $0.00" };
    }

    const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: { mimeType, data: imageBase64 },
                },
                {
                  text: "Extract all text from this ticket or receipt. Return only the raw text, no formatting.",
                },
              ],
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return { text };
  },
});
