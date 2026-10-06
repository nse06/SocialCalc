"use client";

import { type ReactNode, useId, useState } from "react";
import { cn } from "@/lib/cn";
import { formatNumber, parseHumanNumber } from "@/lib/pricing/format";

type Mode = "count" | "percent" | "money";

interface NumberFieldProps {
  label: ReactNode;
  hint?: ReactNode;
  value: number | null;
  onValueChange: (value: number | null) => void;
  mode?: Mode;
  placeholder?: string;
  error?: string | null;
  warning?: string | null;
  autoFocus?: boolean;
  disabled?: boolean;
  size?: "lg" | "md";
  onEnter?: () => void;
  id?: string;
}

function display(value: number | null, mode: Mode): string {
  if (value === null || !Number.isFinite(value)) return "";
  if (mode === "percent") return String(Number(value.toFixed(2)));
  return formatNumber(value);
}

/**
 * Forgiving numeric input: accepts "10k", "1.2M", "10,000", "$400", "3%".
 * Uses a text input so shorthand works; mobile still gets a numeric keypad.
 */
export function NumberField({
  label,
  hint,
  value,
  onValueChange,
  mode = "count",
  placeholder,
  error,
  warning,
  autoFocus,
  disabled,
  size = "lg",
  onEnter,
  id,
}: NumberFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const msgId = `${inputId}-msg`;
  const [text, setText] = useState(() => display(value, mode));
  const [syncedValue, setSyncedValue] = useState(value);

  // When the value changes from outside (e.g. the engagement helper), show it.
  if (value !== syncedValue) {
    setSyncedValue(value);
    const parsed = parseHumanNumber(text, { decimalComma: mode === "percent" });
    if ((Number.isNaN(parsed) ? null : parsed) !== value) setText(display(value, mode));
  }

  const message = error || warning;

  return (
    <div>
      <label htmlFor={inputId} className="block text-[15px] font-semibold text-ink">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="mt-1 text-sm leading-snug text-muted">
          {hint}
        </p>
      ) : null}
      <div
        className={cn(
          "mt-2.5 flex items-center rounded-2xl border bg-surface transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[0_0_0_3px_rgb(91_61_245/0.14)]",
          error ? "border-negative" : "border-line-strong",
          disabled && "opacity-50",
          size === "lg" ? "h-14 px-4" : "h-12 px-3.5",
        )}
      >
        {mode === "money" ? <span className="mr-1 text-lg font-semibold text-faint">$</span> : null}
        <input
          id={inputId}
          type="text"
          inputMode={mode === "count" ? "numeric" : "decimal"}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={cn(hint ? hintId : "", message ? msgId : "") || undefined}
          value={text}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            const parsed = parseHumanNumber(raw, { decimalComma: mode === "percent" });
            onValueChange(Number.isNaN(parsed) ? null : parsed);
          }}
          onBlur={() => {
            const parsed = parseHumanNumber(text, { decimalComma: mode === "percent" });
            if (!Number.isNaN(parsed)) setText(display(parsed, mode));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) {
              e.preventDefault();
              onEnter();
            }
          }}
          className={cn(
            "h-full w-full min-w-0 bg-transparent font-semibold tabular-nums text-ink outline-none placeholder:font-normal placeholder:text-faint",
            size === "lg" ? "text-xl" : "text-lg",
          )}
        />
        {mode === "percent" ? <span className="ml-1 text-lg font-semibold text-faint">%</span> : null}
      </div>
      {message ? (
        <p
          id={msgId}
          role={error ? "alert" : undefined}
          className={cn("mt-2 text-sm leading-snug", error ? "text-negative" : "text-caution")}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
