import Link from "next/link";
import type { MouseEventHandler } from "react";

interface TimeSlotButtonProps {
  label: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  booked?: boolean;
}

const tileClass =
  "flex min-w-24 flex-col items-center rounded-lg border px-4 py-2 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function TimeSlotButton({
  label,
  href,
  onClick,
  booked = false,
}: TimeSlotButtonProps) {
  if (booked) {
    return (
      <button
        type="button"
        disabled
        className={`${tileClass} cursor-not-allowed border-line bg-zinc-100 text-muted`}
      >
        <span className="font-bold line-through">{label}</span>
        <span className="text-sm">Booked</span>
      </button>
    );
  }

  const freeClass = `${tileClass} border-line bg-white text-ink hover:border-brand`;
  const content = (
    <>
      <span className="font-bold">{label}</span>
      <span className="text-sm text-muted">Free</span>
    </>
  );

  return href ? (
    <Link href={href} className={freeClass}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={freeClass}>
      {content}
    </button>
  );
}
