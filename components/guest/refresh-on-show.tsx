"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// Back/forward navigation re-shows a cached copy of the page; refetch so slots booked meanwhile show as booked.
export function RefreshOnShow() {
  const router = useRouter();
  const shownBefore = useRef(false);

  useEffect(() => {
    if (shownBefore.current) router.refresh();
    shownBefore.current = true;
  }, [router]);

  return null;
}
