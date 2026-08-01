export const PUBLIC_VIEW_SESSION_SECONDS = 24 * 60 * 60
export const PUBLIC_VIEW_PASSWORD_MIN_LENGTH = 10
export const PUBLIC_VIEW_PASSWORD_MAX_LENGTH = 128
export const PUBLIC_VIEW_ROUTE_PREFIX = "/view"

export function publicViewAccessPath(organizationSlug: string): string {
  return `${PUBLIC_VIEW_ROUTE_PREFIX}/${encodeURIComponent(organizationSlug)}`
}

export function isPublicViewPath(pathname: string): boolean {
  return (
    pathname === PUBLIC_VIEW_ROUTE_PREFIX ||
    pathname.startsWith(`${PUBLIC_VIEW_ROUTE_PREFIX}/`)
  )
}

export function safePublicViewRedirect(
  organizationSlug: string,
  value: string | undefined
): string | null {
  if (!value?.startsWith("/") || value.startsWith("//")) return null
  const prefix = publicViewAccessPath(organizationSlug)
  return value === prefix || value.startsWith(`${prefix}/`) ? value : null
}
