import { createMiddleware } from "@tanstack/react-start"

import { AUTH_PAGE_PATHS, isPublicAuthPath } from "@/lib/auth-routes"
import {
  DEFAULT_ORGANIZATION_BRAND_COLOR,
  organizationBrandColorForPath,
  organizationBrandColorFromMetadata,
} from "@/lib/organization-brand"
import type { OrganizationBrandColor } from "@/lib/organization-brand"
import { isPublicViewPath } from "@/lib/public-view"

/** Applied to every protected server function. */
export const authed = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { getRequestHeaders } = await import("@tanstack/react-start/server")
    const { getAuth } = await import("../auth/auth")
    const session = await getAuth().api.getSession({
      headers: getRequestHeaders(),
    })
    if (!session?.user.emailVerified) throw new Error("Not authenticated.")
    return next({ context: { auth: session } })
  }
)

/** Guards rendered pages; server functions additionally check themselves. */
export const protectedPages = createMiddleware({ type: "request" }).server(
  async ({ handlerType, next, pathname, request }) => {
    if (
      handlerType === "serverFn" ||
      pathname.startsWith("/assets/") ||
      pathname.startsWith("/_")
    ) {
      return next()
    }
    if (AUTH_PAGE_PATHS.has(pathname)) {
      await setBrandColorCookie(DEFAULT_ORGANIZATION_BRAND_COLOR, request.url)
      return next()
    }
    if (isPublicAuthPath(pathname)) return next()
    if (isPublicViewPath(pathname)) {
      const { setResponseHeader } = await import("@tanstack/react-start/server")
      setResponseHeader("Cache-Control", "private, no-store")
      setResponseHeader("X-Robots-Tag", "noindex, nofollow, noarchive")
      const organizationSlug = pathname.split("/").filter(Boolean)[1]
      if (organizationSlug) {
        const { getDb } = await import("../db/client")
        const { findOrganizationPublicViewBySlug } =
          await import("../repositories/organization-public-view")
        const record = await findOrganizationPublicViewBySlug(
          getDb(),
          safeDecodePathSegment(organizationSlug)
        )
        if (record?.enabled) {
          await setBrandColorCookie(
            organizationBrandColorFromMetadata(record.organizationMetadata),
            request.url
          )
        }
      }
      return next()
    }
    const { getAuth } = await import("../auth/auth")
    const session = await getAuth().api.getSession({ headers: request.headers })
    if (session?.user.emailVerified) {
      const organizations = await getAuth().api.listOrganizations({
        headers: request.headers,
      })
      if (
        organizations.length === 0 &&
        pathname !== "/clubs" &&
        pathname !== "/clubs/" &&
        pathname !== "/clubs/new"
      ) {
        return new Response(null, {
          status: 302,
          headers: { Location: new URL("/clubs", request.url).toString() },
        })
      }
      const brandColor =
        organizationBrandColorForPath(
          pathname,
          organizations.map((organization) => ({
            id: organization.id,
            slug: organization.slug,
            brandColor: organizationBrandColorFromMetadata(
              organization.metadata
            ),
          })),
          session.session.activeOrganizationId
        ) ?? DEFAULT_ORGANIZATION_BRAND_COLOR
      await setBrandColorCookie(brandColor, request.url)
      return next()
    }

    const signInUrl = new URL("/login", request.url)
    signInUrl.searchParams.set(
      "redirect",
      `${pathname}${new URL(request.url).search}`
    )
    return new Response(null, {
      status: 302,
      headers: { Location: signInUrl.toString() },
    })
  }
)

async function setBrandColorCookie(
  brandColor: OrganizationBrandColor,
  requestUrl: string
) {
  const { setOrganizationBrandColorCookie } =
    await import("../organization-brand-cookie.server")
  await setOrganizationBrandColorCookie(
    brandColor,
    new URL(requestUrl).protocol === "https:"
  )
}

function safeDecodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
