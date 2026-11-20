import { logOutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logOutAction}>
      <Button type="submit" variant="secondary" className="px-4 py-1.5">
        Log out
      </Button>
    </form>
  );
}
