import type { Metadata } from "next";
import { Calculator } from "@/components/calculator/calculator";

export const metadata: Metadata = {
  title: "Brand Deal Rate Calculator",
  description:
    "Answer a few quick questions and get a fair starting price for your next sponsored post, Reel, TikTok, YouTube integration, or UGC deal — plus a quote you can send.",
  alternates: { canonical: "/calculator" },
};

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-6 sm:px-6 sm:pt-12">
      <h1 className="sr-only">Brand deal rate calculator</h1>
      <Calculator source="calculator" />
      <p className="mt-10 text-center text-[13px] text-muted">Free · No account needed · Your answers stay in your browser</p>
    </div>
  );
}
