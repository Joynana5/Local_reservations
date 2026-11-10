import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-4xl font-bold leading-10 tracking-tight text-black dark:text-zinc-50">
            TableNook
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Find your perfect table. Search local restaurants by neighborhood, date, and time.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-5 text-white transition-colors md:w-[158px]"
            href="/search"
          >
            Search Now
          </Link>
        </div>
      </main>
    </div>
  );
}
