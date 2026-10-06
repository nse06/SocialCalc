import Link from "next/link";
import { cn } from "@/lib/cn";
import { SITE } from "@/lib/site";

export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" fill="#0e0e14" />
      <path
        d="M19.6 11.6c-.7-1.4-2.2-2.2-4-2.2-2.3 0-3.9 1.2-3.9 3 0 4.1 8.2 2.4 8.2 6.7 0 1.9-1.8 3.2-4.2 3.2-2 0-3.6-.9-4.3-2.4"
        fill="none"
        stroke="#fff"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path d="M15.7 6.6v2.6M15.7 22.5v2.6" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="24.6" cy="24.4" r="2.6" fill="#8b6cff" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 rounded-lg", className)} aria-label={`${SITE.name} — home`}>
      <LogoMark />
      <span className="text-[15.5px] font-semibold tracking-tight text-ink">
        How Much Should I <span className="text-accent">Charge?</span>
      </span>
    </Link>
  );
}
