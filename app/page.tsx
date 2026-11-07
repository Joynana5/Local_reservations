import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import {
  defaultFilters,
  neighborhoods,
  parseFilters,
  type SearchParams,
} from "@/lib/search";
import { searchRestaurants } from "@/lib/restaurant-search";

type Props = { searchParams: Promise<SearchParams> };

export default function Home({ searchParams }: Props) {
  return (
    <main>
      <header className="site-header">
        <div className="shell header-inner">
          <Link className="brand" href="/" aria-label="TableNook home">
            <span className="brand-mark">T</span> TableNook
          </Link>
          <span className="header-note">Made for Maple Bay</span>
        </div>
      </header>
      <section className="hero">
        <div className="shell">
          <p className="eyebrow">YOUR TABLE AWAITS</p>
          <h1>Good food, closer to home.</h1>
          <p>Discover independent restaurants and find a table in Maple Bay.</p>
        </div>
      </section>
      <Suspense fallback={<div className="shell results">Loading restaurants...</div>}>
        <SearchContent searchParams={searchParams} />
      </Suspense>
      <footer className="shell footer">TableNook · Made for local tables</footer>
    </main>
  );
}

async function SearchContent({ searchParams }: Props) {
  await connection();
  const params = await searchParams;
  const defaults = defaultFilters();
  const parsed = parseFilters(params, defaults);
  const filters = parsed.ok ? parsed.filters : defaults;
  let results: Awaited<ReturnType<typeof searchRestaurants>> | null = null;
  let loadError = false;

  if (parsed.ok) {
    try {
      results = await searchRestaurants(filters);
    } catch (error) {
      console.error("Restaurant search failed:", error);
      loadError = true;
    }
  }

  const applied = ["neighborhood", "date", "time", "partySize"].some((key) => params[key] !== undefined);
  const visible = results?.filter((restaurant) => !applied || restaurant.available);

  return (
    <div className="shell">
      <form className="search-form" method="get">
        <div className="field">
          <label htmlFor="neighborhood">Neighborhood</label>
          <select id="neighborhood" name="neighborhood" defaultValue={filters.neighborhood}>
            <option value="">All neighborhoods</option>
            {neighborhoods.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" name="date" type="date" required min={defaults.date} defaultValue={filters.date} />
        </div>
        <div className="field">
          <label htmlFor="time">Time</label>
          <input id="time" name="time" type="time" required step="1800" defaultValue={filters.time} />
        </div>
        <div className="field">
          <label htmlFor="partySize">Party size</label>
          <select id="partySize" name="partySize" defaultValue={filters.partySize}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((size) => (
              <option key={size} value={size}>{size} {size === 1 ? "person" : "people"}</option>
            ))}
          </select>
        </div>
        <button type="submit">Find a table</button>
      </form>
      <p className="time-note">Times are local to Maple Bay (Pacific time). Reservations occupy a table for 90 minutes.</p>
      <section className="results" aria-labelledby="results-heading">
        <div className="results-heading">
          <div>
            <p className="eyebrow">EXPLORE MAPLE BAY</p>
            <h2 id="results-heading">Local favorites</h2>
          </div>
          {visible && <p>{visible.length} {visible.length === 1 ? "restaurant" : "restaurants"}</p>}
        </div>
        {!parsed.ok && <div className="message" role="alert">{parsed.error} Please update your search and try again.</div>}
        {loadError && <div className="message" role="alert">We couldn&apos;t load availability right now. Please try again later.</div>}
        {visible?.length === 0 && (
          <div className="message">No restaurants match this search. Try another time, date, party size, or neighborhood.</div>
        )}
        {visible && visible.length > 0 && (
          <div className="restaurant-grid">
            {visible.map((restaurant) => (
              <article className="restaurant-card" key={restaurant.id}>
                <div className="card-top">
                  <span className="cuisine">{restaurant.cuisine}</span>
                  <span className={restaurant.available ? "availability available" : "availability unavailable"}>
                    {restaurant.available ? "Available" : "Unavailable"}
                  </span>
                </div>
                <h3>{restaurant.name}</h3>
                <p className="location">{restaurant.neighborhood} · {restaurant.address}</p>
                <p className="description">{restaurant.description}</p>
                <div className="card-bottom">{restaurant.available ? "Table available at selected time" : "No table available at selected time"}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
