import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-accent px-3 py-1 text-sm font-bold text-ink">
      {children}
    </span>
  );
}
