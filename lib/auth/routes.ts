export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const DASHBOARD_PATH = "/dashboard";
export const SETUP_PATH = "/setup";

const PROTECTED_PREFIXES = [DASHBOARD_PATH, SETUP_PATH];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAuthPagePath(pathname: string): boolean {
  return pathname === LOGIN_PATH || pathname === SIGNUP_PATH;
}
