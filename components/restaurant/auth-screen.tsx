import { redirect } from "next/navigation";
import { getSignedInUser } from "@/lib/auth/session";
import { DASHBOARD_PATH, LOGIN_PATH, SIGNUP_PATH } from "@/lib/auth/routes";
import { AuthForm } from "@/components/restaurant/auth-form";
import { Tabs } from "@/components/ui/tabs";

export async function AuthScreen({ mode }: { mode: "login" | "signup" }) {
  if (await getSignedInUser()) redirect(DASHBOARD_PATH);

  return (
    <main className="mx-auto max-w-[540px] px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">
        TableNook for restaurants
      </h1>
      <p className="mt-2 text-muted">
        Take bookings online for free. Set up takes about 10 minutes.
      </p>
      <div className="mt-6 rounded-xl border border-line bg-white p-6">
        <Tabs
          label="Restaurant account"
          activeId={mode}
          tabs={[
            { id: "login", label: "Log in", href: LOGIN_PATH },
            { id: "signup", label: "Sign up", href: SIGNUP_PATH },
          ]}
        />
        <div className="mt-6">
          <AuthForm key={mode} mode={mode} />
        </div>
      </div>
    </main>
  );
}
