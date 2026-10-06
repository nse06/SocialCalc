import type { DraftPreset } from "@/lib/pricing/draft";

/**
 * Deal terms pulled out of a brand's email or brief. The extractor never
 * prices anything — it only pre-fills calculator answers, which the creator
 * confirms. Pricing always stays in the deterministic engine.
 */
export interface ExtractedDealTerms {
  /** Calculator answers the extractor found, ready to pre-fill. */
  preset: DraftPreset;
  /** The snippet of text behind each answer, so the UI can show its work. */
  evidence: Partial<Record<keyof DraftPreset, string>>;
  /** Things the brand asked for that the calculator doesn't price (e.g. raw footage). */
  unpriced: string[];
  source: "heuristic" | "remote";
}

export interface DealTermsExtractor {
  extract(text: string): Promise<ExtractedDealTerms>;
}
