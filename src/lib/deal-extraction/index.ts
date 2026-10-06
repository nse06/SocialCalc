/**
 * "Paste the brand's email" → calculator answers.
 *
 * Today: a free, deterministic keyword extractor runs in the browser.
 * Later: set NEXT_PUBLIC_DEAL_EXTRACTION_ENDPOINT to a small serverless function
 * that asks an LLM to fill the same ExtractedDealTerms shape. Only extraction
 * would use a model — pricing always stays in the deterministic engine.
 */
import { heuristicExtractor } from "./heuristic";
import type { DealTermsExtractor, ExtractedDealTerms } from "./types";

export type { DealTermsExtractor, ExtractedDealTerms } from "./types";

function remoteExtractor(endpoint: string): DealTermsExtractor {
  return {
    async extract(text) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!response.ok) throw new Error(`Extraction failed: ${response.status}`);
        const data = (await response.json()) as ExtractedDealTerms;
        return { ...data, source: "remote" };
      } catch {
        // Never block the creator — fall back to the local extractor.
        return heuristicExtractor.extract(text);
      }
    },
  };
}

export function getDealExtractor(): DealTermsExtractor {
  const endpoint = process.env.NEXT_PUBLIC_DEAL_EXTRACTION_ENDPOINT;
  return endpoint ? remoteExtractor(endpoint) : heuristicExtractor;
}
