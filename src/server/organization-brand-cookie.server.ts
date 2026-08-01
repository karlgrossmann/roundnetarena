import "@tanstack/react-start/server-only"

import {
  ORGANIZATION_BRAND_COOKIE_MAX_AGE,
  ORGANIZATION_BRAND_COOKIE_NAME,
} from "@/lib/organization-brand"
import type { OrganizationBrandColor } from "@/lib/organization-brand"

export async function setOrganizationBrandColorCookie(
  brandColor: OrganizationBrandColor,
  secure: boolean
) {
  const { setCookie } = await import("@tanstack/react-start/server")
  setCookie(ORGANIZATION_BRAND_COOKIE_NAME, brandColor, {
    httpOnly: false,
    maxAge: ORGANIZATION_BRAND_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure,
  })
}
