import { redirect } from "next/navigation";
import { getSignedInUser } from "@/lib/auth/session";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DashboardPage() {
  if (!(await getSignedInUser())) redirect(LOGIN_PATH);

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="mt-6">
        <EmptyState title="No reservations today">
          Your reservations will appear here once guests start booking.
        </EmptyState>
      </div>
    </main>
  );
}
