import { PRICING_CONFIG } from "./config";

const { locale, currency } = PRICING_CONFIG;

const currencyFormatter = new Intl.NumberFormat(locale, {
  style: "currency",
  currency,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
const compactFormatter = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });

/** $1,100 — whole dollars only. */
export function formatMoney(value: number): string {
  return currencyFormatter.format(Math.round(value));
}

/** +$250 / −$40 */
export function formatSignedMoney(value: number): string {
  const rounded = Math.round(value);
  if (rounded === 0) return "+$0";
  return `${rounded > 0 ? "+" : "−"}${formatMoney(Math.abs(rounded))}`;
}

/** +10% / −15% / 0% */
export function formatSignedPercent(fraction: number): string {
  const pct = Math.round(fraction * 100);
  if (pct === 0) return "0%";
  return `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** 12.5K, 1.2M */
export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

/** Percent with sensible precision: 3%, 2.5%, 0.45% */
export function formatPercent(value: number): string {
  const digits = value >= 10 ? 0 : value >= 1 ? 1 : 2;
  return `${Number(value.toFixed(digits))}%`;
}

/** Rounds an estimate for "about N views" copy: 12,750 → 13,000; 3,000 → 3,000; 12,500 → 12,500. */
export function roughly(value: number): number {
  if (value < 100) return Math.round(value);
  if (value < 1_000) return Math.round(value / 10) * 10;
  if (value < 10_000) return Math.round(value / 100) * 100;
  if (value < 100_000) return Math.round(value / 500) * 500;
  const magnitude = 10 ** (Math.floor(Math.log10(value)) - 1);
  return Math.round(value / magnitude) * magnitude;
}

/**
 * Lenient numeric parsing for human input: "10k", "1.2M", "10,000", "$1,200",
 * "3%", " 4.5 ". Returns NaN when the input isn't a number.
 *
 * With `decimalComma`, a single comma followed by 1–2 digits is treated as a
 * decimal separator ("3,5" → 3.5), which suits percentage fields.
 */
export function parseHumanNumber(raw: string, options: { decimalComma?: boolean } = {}): number {
  let text = raw.trim().toLowerCase().replace(/[$€£\s%+]/g, "");
  if (!text) return Number.NaN;

  if (options.decimalComma && /^\d+,\d{1,2}$/.test(text)) {
    text = text.replace(",", ".");
  } else {
    text = text.replace(/,/g, "");
  }

  const match = /^(\d+(?:\.\d+)?|\.\d+)([kmb])?$/.exec(text);
  if (!match) return Number.NaN;

  const base = Number.parseFloat(match[1]);
  const suffix = match[2];
  const multiplier = suffix === "k" ? 1e3 : suffix === "m" ? 1e6 : suffix === "b" ? 1e9 : 1;
  return base * multiplier;
}

const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** "one", "three", "12" */
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

/** "a", "a and b", "a, b, and c" */
export function joinList(items: string[]): string {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list[0] ?? "";
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}

export function capitalize(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}
