import { cookies } from "next/headers";
import { createServerSupabaseClient } from "../supabase/server";

// Validates the session with the Auth server (getUser), never trusts the cookie alone.
export async function getSignedInUser() {
  // Outside the try block so Next.js can abort prerendering instead of us swallowing it
  await cookies();
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (cause) {
    console.error(
      "Reading the session failed:",
      cause instanceof Error ? cause.message : "unknown error",
    );
    return null;
  }
}
