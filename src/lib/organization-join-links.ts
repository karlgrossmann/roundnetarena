import type {
  OrganizationJoinLinkPublicStatus,
  OrganizationJoinLinkStatus,
} from "./types"

export const ORGANIZATION_JOIN_LINK_ROLE = "manager" as const
export const ORGANIZATION_JOIN_LINK_DEFAULT_DAYS = 7
export const ORGANIZATION_JOIN_LINK_DEFAULT_MAX_USES = 10
export const ORGANIZATION_JOIN_LINK_MAX_DAYS = 30
export const ORGANIZATION_JOIN_LINK_MAX_USES = 100

export function organizationJoinLinkStatus(
  link: {
    expiresAt: Date
    maxUses: number
    revokedAt: Date | null
    usedCount: number
  },
  now: Date
): OrganizationJoinLinkStatus {
  if (link.revokedAt) return "revoked"
  if (link.expiresAt <= now) return "expired"
  if (link.usedCount >= link.maxUses) return "exhausted"
  return "active"
}

export function publicOrganizationJoinLinkStatus(
  status: OrganizationJoinLinkStatus
): OrganizationJoinLinkPublicStatus {
  return status === "active" ? "valid" : status
}

export function organizationJoinTokenFromRedirect(
  redirect: string | undefined
): string | null {
  if (!redirect?.startsWith("/join?")) return null
  const query = redirect.slice(redirect.indexOf("?") + 1)
  return new URLSearchParams(query).get("token")
}

/** Keeps the plaintext token out of query devtools and SSR dehydration. */
export function organizationJoinLinkCacheKey(token: string): string {
  return token.slice(-12)
}
