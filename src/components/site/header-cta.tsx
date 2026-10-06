"use client";

import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";

/** Hidden on the calculator page itself. */
export function HeaderCta() {
  const pathname = usePathname();
  if (pathname === "/calculator") return null;
  return (
    <ButtonLink href="/calculator" variant="primary" size="sm" className="max-sm:hidden">
      Calculate my rate
    </ButtonLink>
  );
}
