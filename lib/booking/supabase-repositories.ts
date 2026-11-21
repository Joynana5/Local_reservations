import type { BookingRepository } from "./create-reservation";
import type { CancelRepository } from "./cancel-reservation";
import {
  cancelReservationByToken,
  getReservationsForRestaurant,
  getReservationStatusByToken,
  getRestaurantWithDetails,
  insertReservation,
} from "../supabase/admin";

export const supabaseBookingRepository: BookingRepository = {
  getRestaurantDetails: async (restaurantId) => {
    const details = await getRestaurantWithDetails(restaurantId);
    return (
      details && {
        restaurant: details.restaurant,
        openingHours: details.openingHours,
        tables: details.tables,
      }
    );
  },
  getActiveReservations: async (restaurantId, from, to) => {
    const reservations = await getReservationsForRestaurant(
      restaurantId,
      from,
      to,
    );
    return reservations.map((reservation) => ({
      tableId: reservation.table_id,
      startsAt: new Date(reservation.starts_at),
      endsAt: new Date(reservation.ends_at),
      status: reservation.status,
    }));
  },
  insertReservation,
};

export const supabaseCancelRepository: CancelRepository = {
  cancelIfCancellable: cancelReservationByToken,
  getReservation: getReservationStatusByToken,
};
