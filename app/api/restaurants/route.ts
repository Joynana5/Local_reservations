// Public API: GET /api/restaurants
// Searches restaurants that are open and have a free table for the given
// date, time and party size (US-4, FR-5). Reuses searchRestaurants from
// app/actions.ts, so the API and the search page always give the same results.
import { z } from "zod";
import { searchRestaurants } from "../../actions";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format."),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):(00|30)$/, "Use a 30-minute slot, e.g. 18:30."),
  partySize: z.coerce.number().int().min(1).max(20),
  neighborhood: z
    .enum(["Old Harbor", "Riverside", "Midtown", "Hillcrest"])
    .optional(),
});

export async function GET(request: Request) {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return Response.json(
      {
        error: "invalid_query",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const { date, time, partySize, neighborhood } = parsed.data;
  try {
    const restaurants = await searchRestaurants(
      date,
      time,
      partySize,
      neighborhood,
    );
    return Response.json({ restaurants });
  } catch (cause) {
    console.error("GET /api/restaurants failed:", cause);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
