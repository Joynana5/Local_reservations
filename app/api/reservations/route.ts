import { createReservation } from "../../../lib/booking/create-reservation";
import { supabaseBookingRepository } from "../../../lib/booking/supabase-repositories";
import { sendBookingConfirmationEmail } from "../../../lib/email/send-booking-confirmation";

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json(
      {
        error: "validation",
        fieldErrors: { body: ["Request body must be valid JSON."] },
      },
      { status: 400 },
    );
  }

  try {
    const result = await createReservation(
      supabaseBookingRepository,
      input,
      new Date(),
      { sendConfirmation: sendBookingConfirmationEmail },
    );

    if (result.ok) {
      return Response.json(
        {
          reservationId: result.data.reservationId,
          manageToken: result.data.manageToken,
        },
        { status: 201 },
      );
    }

    if (result.code === "validation") {
      return Response.json(
        { error: "validation", fieldErrors: result.fieldErrors },
        { status: 400 },
      );
    }

    const status = result.code === "slot_taken" ? 409 : 422;
    return Response.json(
      {
        error: result.code,
        message: result.message,
        alternatives: result.alternatives,
      },
      { status },
    );
  } catch {
    console.error("POST /api/reservations failed");
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
