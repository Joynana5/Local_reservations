import type { Metadata } from "next";
import { AuthScreen } from "@/components/restaurant/auth-screen";

export const metadata: Metadata = {
  title: "Sign up - TableNook for restaurants",
};

export default function SignupPage() {
  return <AuthScreen mode="signup" />;
}
