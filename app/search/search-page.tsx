"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { searchRestaurants, type RestaurantSearchResult } from "../actions";

const neighborhoods = ["Old Harbor", "Riverside", "Midtown", "Hillcrest"];
const times = Array.from({ length: 48 }, (_, index) =>
  `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`,
);
const subscribeToToday = () => () => {};
const getServerToday = () => "";
const getToday = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const fieldClass = "w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900";

export function SearchPage() {
  const today = useSyncExternalStore(subscribeToToday, getToday, getServerToday);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState("18:00");
  const [partySize, setPartySize] = useState(2);
  const [neighborhood, setNeighborhood] = useState("");
  const [results, setResults] = useState<RestaurantSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const maxDate = today ? new Date(`${today}T00:00:00Z`) : null;
  maxDate?.setUTCDate(maxDate.getUTCDate() + 60);
  const maxDateStr = maxDate?.toISOString().slice(0, 10);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(false);
    setResults(null);
    try {
      setResults(await searchRestaurants(date ?? today, time, partySize, neighborhood || undefined));
    } catch (cause) {
      console.error("Restaurant search failed:", cause);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-zinc-900">Find Your Table</h1>
          <p className="text-lg text-zinc-600 mt-2">Search restaurants by neighborhood and time</p>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <noscript><p>Enable JavaScript to search for restaurant availability.</p></noscript>
        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <label className="block text-sm font-medium text-zinc-900">
              Date
              <input className={`${fieldClass} mt-2`} type="date" required value={date ?? today}
                min={today} max={maxDateStr} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label className="block text-sm font-medium text-zinc-900">
              Time
              <select className={`${fieldClass} mt-2`} value={time} onChange={(event) => setTime(event.target.value)}>
                {times.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-zinc-900">
              Party Size
              <select className={`${fieldClass} mt-2`} value={partySize} onChange={(event) => setPartySize(Number(event.target.value))}>
                {Array.from({ length: 20 }, (_, index) => index + 1).map((size) =>
                  <option key={size} value={size}>{size === 1 ? "1 person" : `${size} people`}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-zinc-900">
              Neighborhood
              <select className={`${fieldClass} mt-2`} value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)}>
                <option value="">All neighborhoods</option>
                {neighborhoods.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <div className="flex items-end">
              <button type="submit" disabled={loading || !today}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white font-medium rounded-lg">
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
          <p className="text-sm text-zinc-600 mt-4">Times are in Maple Bay (Pacific Time).</p>
        </form>

        {loading && <p role="status">Searching for available tables...</p>}
        {error && <p role="alert" className="text-red-700">Search failed. Please try again or choose another time.</p>}
        {!loading && !error && results && (
          results.length === 0 ? (
            <div role="status" className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
              <p>No restaurants found matching your criteria.</p>
              <p>Try another time or neighborhood.</p>
            </div>
          ) : (
            <section aria-label="Available restaurants">
              <h2 className="text-2xl font-bold text-zinc-900 mb-6">Available restaurants ({results.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((restaurant) => (
                  <article key={restaurant.id} className="bg-white rounded-lg border border-zinc-200 p-6">
                    <h3 className="text-xl font-semibold text-zinc-900">{restaurant.name}</h3>
                    <p className="text-sm text-zinc-600 mt-1">{restaurant.cuisine} in {restaurant.neighborhood}</p>
                    <p className="text-sm text-zinc-600 mt-2">{restaurant.address}</p>
                    {restaurant.description && <p className="text-sm text-zinc-600 mt-2">{restaurant.description}</p>}
                    <p className="inline-block mt-4 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">Available at selected time</p>
                  </article>
                ))}
              </div>
            </section>
          )
        )}
      </main>
    </div>
  );
}
