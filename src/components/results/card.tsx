import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-24 rounded-[24px] border border-line bg-surface p-5 shadow-card sm:p-7", className)}>
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, icon }: { title: ReactNode; subtitle?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {icon ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">{icon}</span>
      ) : null}
      <div>
        <h2 className="text-xl leading-tight font-semibold tracking-tight text-ink sm:text-[22px]">{title}</h2>
        {subtitle ? <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted text-pretty">{subtitle}</p> : null}
      </div>
    </div>
  );
}
