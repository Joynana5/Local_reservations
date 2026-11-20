import Link from "next/link";
import type { ReactNode } from "react";

interface SiteHeaderProps {
  variant?: "guest" | "restaurant";
  actions?: ReactNode;
}

export function SiteHeader({ variant = "guest", actions }: SiteHeaderProps) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-brand focus-visible:outline-2 focus-visible:outline-brand"
        >
          TableNook
        </Link>
        {variant === "restaurant" && (
          <>
            <span aria-hidden="true" className="text-muted">
              |
            </span>
            <span className="font-bold text-ink">Restaurant</span>
            <div className="ml-auto flex items-center gap-4">
              <Link
                href="/search"
                className="text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
              >
                Guest site
              </Link>
              {actions}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
