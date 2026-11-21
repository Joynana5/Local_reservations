import { cancelReservation } from "../../../../lib/booking/cancel-reservation";
import { supabaseCancelRepository } from "../../../../lib/booking/supabase-repositories";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  try {
    const result = await cancelReservation(
      supabaseCancelRepository,
      token,
      new Date(),
    );

    if (result.ok) {
      return Response.json({
        alreadyCancelled: result.data.alreadyCancelled,
      });
    }

    if (result.code === "not_found") {
      return Response.json(
        { error: "not_found", message: result.message },
        { status: 404 },
      );
    }

    return Response.json(
      { error: "not_cancellable", message: result.message },
      { status: 409 },
    );
  } catch {
    console.error("DELETE /api/reservations/[token] failed");
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
