import Link from "next/link";

type Variant = "guest" | "restaurant";

interface SiteHeaderProps {
  variant?: Variant;
}

function LogoIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 21v-8a8 8 0 0 1 16 0v8" />
      <path d="M9 21v-5M15 21v-5" />
    </svg>
  );
}

export function SiteHeader({ variant = "guest" }: SiteHeaderProps) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-brand focus-visible:outline-2 focus-visible:outline-brand"
        >
          <LogoIcon />
          TableNook
        </Link>
        {variant === "restaurant" && (
          <>
            <span aria-hidden="true" className="text-line">
              |
            </span>
            <span className="text-base font-bold text-ink">Restaurant</span>
            <Link
              href="/"
              className="ml-auto text-sm font-bold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
            >
              Guest site
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
