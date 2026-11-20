import type { Metadata } from "next";
import { AuthScreen } from "@/components/restaurant/auth-screen";

export const metadata: Metadata = {
  title: "Log in - TableNook for restaurants",
};

export default function LoginPage() {
  return <AuthScreen mode="login" />;
}
