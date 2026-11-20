import Link from "next/link";
import type { ReactNode } from "react";

export interface TabItem {
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
}

const tabBase =
  "inline-block border-b-2 px-1 pb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function Tabs({
  items,
  label,
}: {
  items: TabItem[];
  label: string;
}): ReactNode {
  return (
    <nav aria-label={label}>
      <ul className="flex gap-6 border-b border-line">
        {items.map((item) => (
          <li key={item.label}>
            {item.disabled || !item.href ? (
              <span
                aria-disabled="true"
                className={`${tabBase} border-transparent text-muted`}
              >
                {item.label}
                {item.badge && (
                  <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-xs font-bold">
                    {item.badge}
                  </span>
                )}
              </span>
            ) : (
              <Link
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`${tabBase} ${
                  item.active
                    ? "border-brand font-bold text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
