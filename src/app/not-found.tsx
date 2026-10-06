import { ButtonLink } from "@/components/ui/button";
import { ArrowRight } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-20 text-center sm:px-6">
      <p className="text-[13px] font-semibold tracking-[0.08em] text-accent uppercase">404</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">This page doesn&apos;t exist.</h1>
      <p className="mt-4 text-lg text-ink-soft">But your next brand deal does. Let&apos;s price it.</p>
      <ButtonLink href="/calculator" variant="accent" size="lg" className="mt-8">
        Calculate My Rate
        <ArrowRight size={18} />
      </ButtonLink>
    </div>
  );
}
