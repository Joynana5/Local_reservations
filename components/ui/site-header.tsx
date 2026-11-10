import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1100px] items-center px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-brand focus-visible:outline-2 focus-visible:outline-brand"
        >
          TableNook
        </Link>
      </div>
    </header>
  );
}
