import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_PATH, isProtectedPath } from "./lib/auth/routes";

// Refreshes the Supabase session cookies and sends logged-out visitors of
// protected owner pages to /login.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  let signedIn = false;
  try {
    const { data } = await supabase.auth.getUser();
    signedIn = data.user !== null;
  } catch (cause) {
    console.error(
      "Session check failed:",
      cause instanceof Error ? cause.message : "unknown error",
    );
  }

  if (!signedIn && isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/setup/:path*"],
};
