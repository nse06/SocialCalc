"use client";

import { type KeyboardEvent, type ReactNode, useRef } from "react";
import { cn } from "@/lib/cn";
import { Check } from "./icons";

export interface ChoiceOption<T extends string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Right-aligned extra content, e.g. a price. */
  aside?: ReactNode;
  disabled?: boolean;
}

interface ChoiceGroupProps<T extends string> {
  label: string;
  options: ChoiceOption<T>[];
  value: T | null | undefined;
  /** `fromPointer` is true for mouse/touch selection — used to auto-advance. */
  onSelect: (value: T, meta: { fromPointer: boolean }) => void;
  layout?: "list" | "grid" | "chips";
  /** Grid columns from the `sm` breakpoint up (always 2 on phones). */
  columns?: 2 | 3;
  className?: string;
}

/**
 * Large, tappable single-choice options. Arrow keys move focus; Enter/Space
 * selects. Selection by keyboard never auto-advances.
 */
export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
  layout = "list",
  columns = 3,
  className,
}: ChoiceGroupProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    const pos = enabled.indexOf(index);
    let next = index;
    if (event.key === "Home") next = enabled[0];
    else if (event.key === "End") next = enabled[enabled.length - 1];
    else if (event.key === "ArrowDown" || event.key === "ArrowRight") next = enabled[(pos + 1) % enabled.length];
    else next = enabled[(pos - 1 + enabled.length) % enabled.length];
    refs.current[next]?.focus();
  }

  const isChips = layout === "chips";

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        layout === "list" && "grid gap-2.5",
        layout === "grid" && cn("grid grid-cols-2 gap-2.5", columns === 3 && "sm:grid-cols-3"),
        isChips && "flex flex-wrap gap-2",
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const focusable = selected || (selectedIndex === -1 && index === 0);
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={option.disabled}
            tabIndex={focusable ? 0 : -1}
            onKeyDown={(e) => onKeyDown(e, index)}
            onClick={(e) => onSelect(option.value, { fromPointer: e.detail > 0 })}
            className={cn(
              "group relative text-left transition-[background-color,border-color,box-shadow,color] duration-150 disabled:cursor-not-allowed disabled:opacity-40",
              isChips
                ? cn(
                    "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-medium",
                    selected
                      ? "border-ink bg-ink text-white"
                      : "border-line-strong bg-surface text-ink-soft hover:border-faint hover:text-ink",
                  )
                : cn(
                    "flex min-h-[60px] w-full items-center gap-3.5 rounded-2xl border bg-surface px-4 py-3.5",
                    layout === "grid" && "min-h-[60px] gap-3 px-3.5",
                    selected
                      ? "border-accent bg-accent-soft/60 shadow-[0_0_0_3px_rgb(91_61_245/0.14)]"
                      : "border-line hover:border-line-strong hover:shadow-card",
                  ),
            )}
          >
            {option.icon ? (
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center transition-colors",
                  isChips ? "" : "size-10 rounded-xl",
                  !isChips && (selected ? "bg-accent text-white" : "bg-subtle text-ink-soft group-hover:text-ink"),
                )}
              >
                {option.icon}
              </span>
            ) : null}
            {isChips ? (
              <span>{option.label}</span>
            ) : (
              <span className="min-w-0 flex-1">
                <span className="block text-[15.5px] font-semibold leading-snug text-ink">{option.label}</span>
                {option.description ? (
                  <span className="mt-0.5 block text-sm leading-snug text-muted">{option.description}</span>
                ) : null}
              </span>
            )}
            {option.aside ? <span className="shrink-0">{option.aside}</span> : null}
            {!isChips && layout === "list" ? (
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected ? "border-accent bg-accent text-white" : "border-line-strong bg-surface text-transparent",
                )}
              >
                <Check size={14} strokeWidth={3} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
