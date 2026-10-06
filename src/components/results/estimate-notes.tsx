import Link from "next/link";
import { Alert, Info } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { RateResult } from "@/lib/pricing/types";
import { Card, CardHeader } from "./card";
import { CONFIDENCE_COPY } from "./helpers";

export function EstimateNotes({ result }: { result: RateResult }) {
  const confidence = CONFIDENCE_COPY[result.confidence];
  return (
    <Card>
      <CardHeader title="About this estimate" subtitle={`${confidence.label}. ${confidence.tip}`} />
      {result.notes.length ? (
        <ul className="grid gap-3">
          {result.notes.map((note) => (
            <li
              key={note.id}
              className={cn(
                "flex gap-3 rounded-2xl border p-4",
                note.tone === "caution" ? "border-caution-line bg-caution-soft/60" : "border-line bg-canvas",
              )}
            >
              {note.tone === "caution" ? (
                <Alert size={18} className="mt-0.5 shrink-0 text-caution" aria-label="Heads up" />
              ) : (
                <Info size={18} className="mt-0.5 shrink-0 text-muted" aria-label="Note" />
              )}
              <div>
                <p className="text-[14.5px] font-semibold text-ink">{note.title}</p>
                <p className="mt-0.5 text-[14px] leading-relaxed text-ink-soft">{note.body}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4 text-[13px] leading-relaxed text-muted">
        Creator rates vary widely. This calculator is a planning and negotiation tool built on transparent assumptions — not a
        guaranteed market price.{" "}
        <Link href="/methodology" className="font-medium text-accent underline-offset-4 hover:underline">
          Read the methodology
        </Link>
        .
      </p>
    </Card>
  );
}
