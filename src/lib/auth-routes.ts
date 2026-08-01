export const AUTH_PAGE_PATHS = new Set([
  "/accept-invitation",
  "/forgot-password",
  "/join",
  "/login",
  "/register",
  "/resend-verification",
  "/reset-password",
  "/verify-email",
])

export function isPublicAuthPath(pathname: string): boolean {
  return (
    AUTH_PAGE_PATHS.has(pathname) ||
    pathname === "/api/auth" ||
    pathname.startsWith("/api/auth/")
  )
}

export function safeAuthRedirect(value: string | undefined): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/"
}
