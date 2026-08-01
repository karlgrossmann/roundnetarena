export const ORGANIZATION_BRAND_COLORS = [
  "purple",
  "blue",
  "indigo",
  "green",
  "lime",
  "yellow",
  "orange",
  "red",
] as const

export type OrganizationBrandColor = (typeof ORGANIZATION_BRAND_COLORS)[number]

/** The application's own color — it applies until a club picks one of its own. */
export const DEFAULT_ORGANIZATION_BRAND_COLOR: OrganizationBrandColor = "orange"
export const ORGANIZATION_BRAND_COOKIE_NAME = "roundnet-brand-color"
export const ORGANIZATION_BRAND_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

const ORGANIZATION_BRAND_COLOR_SET = new Set<string>(ORGANIZATION_BRAND_COLORS)

interface OrganizationBrandCandidate {
  id: string
  slug: string
  brandColor: OrganizationBrandColor
  isActive?: boolean
}

export function isOrganizationBrandColor(
  value: unknown
): value is OrganizationBrandColor {
  return typeof value === "string" && ORGANIZATION_BRAND_COLOR_SET.has(value)
}

export function organizationMetadata(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      return organizationMetadata(JSON.parse(value))
    } catch {
      return {}
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return { ...(value as Record<string, unknown>) }
}

export function organizationBrandColorFromMetadata(
  value: unknown
): OrganizationBrandColor {
  const color = organizationMetadata(value).brandColor
  return isOrganizationBrandColor(color)
    ? color
    : DEFAULT_ORGANIZATION_BRAND_COLOR
}

export function withOrganizationBrandColor(
  metadata: unknown,
  brandColor: OrganizationBrandColor
): Record<string, unknown> {
  return { ...organizationMetadata(metadata), brandColor }
}

export function organizationBrandColorFromCookie(
  cookieHeader: string
): OrganizationBrandColor {
  const value = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${ORGANIZATION_BRAND_COOKIE_NAME}=`))
    ?.slice(ORGANIZATION_BRAND_COOKIE_NAME.length + 1)

  return isOrganizationBrandColor(value)
    ? value
    : DEFAULT_ORGANIZATION_BRAND_COLOR
}

export function organizationBrandColorForPath(
  pathname: string,
  organizations: ReadonlyArray<OrganizationBrandCandidate>,
  activeOrganizationId?: string | null
): OrganizationBrandColor | null {
  const segments = pathname.split("/").filter(Boolean)
  const organizationSlug =
    segments[0] === "o" && segments[1]
      ? safelyDecodePathSegment(segments[1])
      : null
  const organization = organizationSlug
    ? organizations.find((candidate) => candidate.slug === organizationSlug)
    : segments[0] === "clubs" && segments[1] && segments[1] !== "new"
      ? organizations.find((candidate) => candidate.id === segments[1])
      : (organizations.find(
          (candidate) => candidate.id === activeOrganizationId
        ) ?? organizations.find((candidate) => candidate.isActive))

  return organization?.brandColor ?? null
}

function safelyDecodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function applyOrganizationBrandColor(
  root: HTMLElement,
  brandColor: OrganizationBrandColor
) {
  root.dataset.brandColor = brandColor
}

export function writeOrganizationBrandColorCookie(
  documentTarget: Pick<Document, "cookie">,
  brandColor: OrganizationBrandColor,
  secure = window.location.protocol === "https:"
) {
  documentTarget.cookie = [
    `${ORGANIZATION_BRAND_COOKIE_NAME}=${brandColor}`,
    "Path=/",
    `Max-Age=${ORGANIZATION_BRAND_COOKIE_MAX_AGE}`,
    "SameSite=Lax",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ")
}

/**
 * Runs synchronously through `ScriptOnce`. Keep this function self-contained so its
 * serialized form does not rely on module-level variables or imports.
 */
export function applyInitialOrganizationBrand(publicPaths: Array<string>) {
  const allowed = [
    "purple",
    "blue",
    "indigo",
    "green",
    "lime",
    "yellow",
    "orange",
    "red",
  ]
  // Must stay in sync with `DEFAULT_ORGANIZATION_BRAND_COLOR` — this function is
  // serialized and therefore cannot import the value.
  let brandColor = "orange"

  if (!publicPaths.includes(window.location.pathname)) {
    const cookie = document.cookie
      .split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith("roundnet-brand-color="))
    const stored = cookie?.slice("roundnet-brand-color=".length)
    if (stored && allowed.includes(stored)) brandColor = stored
  }

  document.documentElement.dataset.brandColor = brandColor
}
