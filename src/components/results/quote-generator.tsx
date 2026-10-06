"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { CopyButton } from "@/components/ui/copy-button";
import { FileText, MessageSquare } from "@/components/ui/icons";
import { NumberField } from "@/components/ui/number-field";
import { track } from "@/lib/analytics";
import { formatMoney } from "@/lib/pricing/format";
import type { RateResult } from "@/lib/pricing/types";
import { type QuoteBasis, buildBrandReply, buildQuote, formatQuoteText } from "@/lib/quote/quote";
import { Card, CardHeader } from "./card";

interface QuoteGeneratorProps {
  result: RateResult;
  generated: boolean;
  onGenerate: () => void;
}

export function QuoteGenerator({ result, generated, onGenerate }: QuoteGeneratorProps) {
  const [basis, setBasis] = useState<QuoteBasis>("ask");
  const [customTotal, setCustomTotal] = useState<number | null>(null);
  const [brandName, setBrandName] = useState("");
  const [creatorName, setCreatorName] = useState("");

  const quote = useMemo(() => buildQuote(result, basis, customTotal), [result, basis, customTotal]);
  const quoteText = formatQuoteText(quote);
  const reply = buildBrandReply(result, quote, { brandName, creatorName });

  return (
    <Card id="quote">
      <CardHeader
        icon={<FileText size={18} />}
        title="Your quote"
        subtitle="An itemized quote and a short reply you can paste straight into an email or DM."
      />

      {!generated ? (
        <Button variant="accent" size="lg" className="w-full sm:w-auto" onClick={onGenerate}>
          <FileText size={18} />
          Generate my quote
        </Button>
      ) : (
        <div className="grid gap-6 animate-step-in">
          <div>
            <p className="mb-2.5 text-[14px] font-semibold text-ink">Quote at</p>
            <ChoiceGroup
              label="Quote amount"
              layout="chips"
              value={basis}
              options={[
                { value: "ask", label: `Starting ask · ${formatMoney(result.ask)}` },
                { value: "target", label: `Target · ${formatMoney(result.target)}` },
                { value: "custom", label: "Custom" },
              ]}
              onSelect={(value) => setBasis(value)}
            />
            {basis === "custom" ? (
              <div className="mt-3 max-w-xs animate-step-in">
                <NumberField
                  mode="money"
                  size="md"
                  label="Your total"
                  placeholder={String(result.ask)}
                  value={customTotal}
                  onValueChange={setCustomTotal}
                />
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-line bg-canvas p-4 sm:p-5" data-testid="quote-preview">
            <ul className="grid gap-2.5">
              {quote.lines.map((line) => (
                <li key={line.id} className="flex items-baseline gap-3 text-[15px]">
                  <span className="text-ink-soft">{line.label}</span>
                  <span aria-hidden="true" className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-line-strong" />
                  <span className="font-medium text-ink tabular-nums">{formatMoney(line.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3.5">
              <span className="text-[15px] font-semibold text-ink">Total</span>
              <span className="text-xl font-semibold tracking-tight text-ink tabular-nums">{formatMoney(quote.total)}</span>
            </div>
          </div>

          <CopyButton
            getText={() => quoteText}
            className="w-full sm:w-auto"
            onCopied={() => track("quote_copied", { kind: "quote", basis })}
          >
            Copy quote
          </CopyButton>

          <div className="border-t border-line pt-6">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <MessageSquare size={17} className="text-accent" />
              Brand reply
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[13px] font-medium text-ink-soft">Brand name (optional)</span>
                <input
                  type="text"
                  value={brandName}
                  maxLength={60}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Glow Co."
                  className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-ink outline-none placeholder:text-faint focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-[13px] font-medium text-ink-soft">Your name (optional)</span>
                <input
                  type="text"
                  value={creatorName}
                  maxLength={60}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="e.g. Sam"
                  className="mt-1.5 h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-ink outline-none placeholder:text-faint focus:border-accent"
                />
              </label>
            </div>
            <div
              className="mt-3 rounded-2xl border border-line bg-canvas p-4 text-[15px] leading-relaxed whitespace-pre-wrap text-ink-soft sm:p-5"
              data-testid="reply-preview"
            >
              {reply}
            </div>
            <CopyButton
              getText={() => reply}
              variant="secondary"
              className="mt-4 w-full sm:w-auto"
              onCopied={() => track("quote_copied", { kind: "reply", basis })}
            >
              Copy brand reply
            </CopyButton>
          </div>
        </div>
      )}
    </Card>
  );
}
