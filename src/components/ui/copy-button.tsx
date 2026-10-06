"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/clipboard";
import { Button } from "./button";
import { Check, Copy } from "./icons";

interface CopyButtonProps {
  getText: () => string;
  children: ReactNode;
  copiedLabel?: string;
  onCopied?: () => void;
  variant?: "primary" | "accent" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: ReactNode;
}

export function CopyButton({
  getText,
  children,
  copiedLabel = "Copied!",
  onCopied,
  variant = "primary",
  size = "lg",
  className,
  icon,
}: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function handleClick() {
    const ok = await copyText(getText());
    setState(ok ? "copied" : "failed");
    if (ok) onCopied?.();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2200);
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick} aria-live="polite">
      {state === "copied" ? <Check size={18} strokeWidth={2.5} /> : (icon ?? <Copy size={18} />)}
      {state === "copied" ? copiedLabel : state === "failed" ? "Couldn't copy — select the text instead" : children}
    </Button>
  );
}
