import React from "react";
import { formatAmount } from "@/lib/utils/currency";

interface OCRResultProps {
  text: string;
  parsedDate?: number;
  parsedAmount?: number;
  parsedVenue?: string;
  currency: string;
  onRetryGemini: () => void;
  isRetrying?: boolean;
}

export function OCRResult({
  text,
  parsedDate,
  parsedAmount,
  parsedVenue,
  currency,
  onRetryGemini,
  isRetrying,
}: OCRResultProps) {
  const hasData = parsedDate || parsedAmount || parsedVenue;

return (
    <div className="p-4 space-y-3 bg-dragonfly-teal-500/10 border border-dragonfly-teal-500/20 rounded-2xl animate-scale-in">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-dragonfly-navy-50">Extracted Information</h4>
        <span className="text-caption bg-dragonfly-navy-950 px-2 py-0.5 rounded-full border border-dragonfly-navy-700 text-dragonfly-navy-400 font-medium">
          OCR Details
        </span>
      </div>

      {hasData ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-dragonfly-navy-950/80 p-3 rounded-xl border border-dragonfly-navy-700 text-caption">
          {parsedVenue && (
            <div>
              <span className="text-dragonfly-navy-400 block font-medium">Venue/Merchant</span>
              <span className="font-bold text-dragonfly-navy-50">{parsedVenue}</span>
            </div>
          )}
          {parsedAmount !== undefined && (
            <div>
              <span className="text-dragonfly-navy-400 block font-medium">Total Amount</span>
              <span className="font-bold text-dragonfly-teal-400">
                {formatAmount(parsedAmount, currency)}
              </span>
            </div>
          )}
          {parsedDate && (
            <div>
              <span className="text-dragonfly-navy-400 block font-medium">Date</span>
              <span className="font-bold text-dragonfly-navy-50">
                {new Date(parsedDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-500/15 border border-amber-500/30 p-3 rounded-xl text-caption text-amber-400">
          <p className="font-semibold">Could not extract clean values.</p>
          <p className="text-[11px] text-amber-500 mt-0.5">
            You can analyze with AI for advanced handwritten & complex layout recognition.
          </p>
          <button
            type="button"
            onClick={onRetryGemini}
            disabled={isRetrying}
            className="mt-2.5 w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg py-2 font-bold text-caption shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-colors duration-fast"
          >
            {isRetrying ? "Analyzing with Gemini AI..." : "✨ Analyze with Gemini Vision"}
          </button>
        </div>
      )}

      {text && (
        <details className="text-caption text-dragonfly-navy-400 mt-2">
          <summary className="cursor-pointer font-medium hover:text-dragonfly-navy-300 transition-colors duration-fast">
            View raw recognition text
          </summary>
          <pre className="mt-1.5 p-2 bg-dragonfly-navy-950 rounded-lg border border-dragonfly-navy-700 whitespace-pre-wrap font-mono text-[10px] text-dragonfly-navy-300">
            {text}
          </pre>
        </details>
      )}
    </div>
  );
}
