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
    <div className="p-4 space-y-3 bg-brand-50/70 border border-brand-100 rounded-2xl">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-gray-900">Extracted Information</h4>
        <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 font-medium">
          OCR Details
        </span>
      </div>

      {hasData ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-gray-100 text-xs">
          {parsedVenue && (
            <div>
              <span className="text-gray-400 block font-medium">Venue/Merchant</span>
              <span className="font-bold text-gray-900">{parsedVenue}</span>
            </div>
          )}
          {parsedAmount !== undefined && (
            <div>
              <span className="text-gray-400 block font-medium">Total Amount</span>
              <span className="font-bold text-brand-700">
                {formatAmount(parsedAmount, currency)}
              </span>
            </div>
          )}
          {parsedDate && (
            <div>
              <span className="text-gray-400 block font-medium">Date</span>
              <span className="font-bold text-gray-900">
                {new Date(parsedDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900">
          <p className="font-semibold">Could not extract clean values.</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            You can analyze with AI for advanced handwritten &amp; complex layout recognition.
          </p>
          <button
            type="button"
            onClick={onRetryGemini}
            disabled={isRetrying}
            className="mt-2.5 w-full bg-amber-600 hover:bg-amber-500 text-white rounded-lg py-2 font-bold text-xs shadow-sm transition-colors"
          >
            {isRetrying ? "Analyzing with Gemini AI..." : "✨ Analyze with Gemini Vision"}
          </button>
        </div>
      )}

      {text && (
        <details className="text-[11px] text-gray-500 mt-2">
          <summary className="cursor-pointer font-medium hover:text-gray-700">
            View raw recognition text
          </summary>
          <pre className="mt-1.5 p-2 bg-white rounded-lg border border-gray-100 whitespace-pre-wrap font-mono text-[10px] text-gray-600">
            {text}
          </pre>
        </details>
      )}
    </div>
  );
}
