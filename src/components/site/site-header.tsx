import Link from "next/link";
import { HeaderCta } from "./header-cta";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/methodology"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-subtle hover:text-ink md:block"
          >
            How it works
          </Link>
          <Link
            href="/calculators"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-subtle hover:text-ink md:block"
          >
            Calculators
          </Link>
          <Link
            href="/brand-deal-email-templates"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-subtle hover:text-ink lg:block"
          >
            Email templates
          </Link>
          <HeaderCta />
        </nav>
      </div>
    </header>
  );
}
