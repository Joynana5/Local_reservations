import type { ReactNode } from "react";

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="rounded-xl border border-line bg-white p-8 text-center"
    >
      <p className="font-bold text-ink">{title}</p>
      {children && <div className="mt-2 text-muted">{children}</div>}
    </div>
  );
}
