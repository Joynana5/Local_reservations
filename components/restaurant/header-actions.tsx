import { getSignedInUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/restaurant/logout-button";

export async function HeaderActions() {
  const user = await getSignedInUser();
  return user ? <LogoutButton /> : null;
}
