import { ButtonLink } from "@/components/ui/button";
import { ArrowRight } from "@/components/ui/icons";

export function CtaBand({
  title = "Ready to price your next deal?",
  body = "It takes about a minute. No account, no email — just a fair number and a quote you can send.",
  href = "/calculator",
}: {
  title?: string;
  body?: string;
  href?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-[32px] bg-night px-6 py-12 text-center text-white sm:px-12 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(124_92_255/0.5),transparent)]"
      />
      <h2 className="mx-auto max-w-xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-night-muted text-pretty">{body}</p>
      <ButtonLink href={href} variant="accent" size="lg" className="mt-8">
        Calculate My Rate
        <ArrowRight size={18} />
      </ButtonLink>
    </section>
  );
}
