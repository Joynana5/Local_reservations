import { Suspense, type ReactNode } from "react";
import { HeaderActions } from "@/components/restaurant/header-actions";
import { SiteHeader } from "@/components/ui/site-header";

export default function RestaurantLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader
        variant="restaurant"
        actions={
          <Suspense fallback={null}>
            <HeaderActions />
          </Suspense>
        }
      />
      {children}
    </div>
  );
}
