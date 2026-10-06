import Link from "next/link";
import { absoluteUrl } from "@/lib/site";
import { JsonLd } from "./json-ld";

export interface Crumb {
  name: string;
  href: string;
}

/** Visible breadcrumb trail plus matching BreadcrumbList structured data. Home is implied. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((crumb, i) => {
            const last = i === all.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="text-ink-soft">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link href={crumb.href} className="underline-offset-4 hover:text-ink hover:underline">
                      {crumb.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((crumb, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: crumb.name,
            item: absoluteUrl(crumb.href),
          })),
        }}
      />
    </>
  );
}
