import type { ReactNode } from "react";
import { SiteHeader } from "@/components/ui/site-header";

export default function RestaurantLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader variant="restaurant" />
      {children}
    </div>
  );
}
