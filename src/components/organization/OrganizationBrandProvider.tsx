import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react"
import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { ScriptOnce, useRouterState } from "@tanstack/react-router"

import { organizationsQueryOptions } from "@/lib/api/queries"
import { AUTH_PAGE_PATHS, isPublicAuthPath } from "@/lib/auth-routes"
import { isPublicViewPath } from "@/lib/public-view"
import {
  DEFAULT_ORGANIZATION_BRAND_COLOR,
  applyInitialOrganizationBrand,
  applyOrganizationBrandColor,
  organizationBrandColorForPath,
  writeOrganizationBrandColorCookie,
} from "@/lib/organization-brand"
import type { OrganizationBrandColor } from "@/lib/organization-brand"

interface OrganizationBrandContextValue {
  setBrandColor: (brandColor: OrganizationBrandColor) => void
}

const OrganizationBrandContext =
  createContext<OrganizationBrandContextValue | null>(null)

const INITIAL_ORGANIZATION_BRAND_SCRIPT = `(${applyInitialOrganizationBrand.toString()})(${JSON.stringify([...AUTH_PAGE_PATHS])})`

export function OrganizationBrandProvider({
  children,
}: {
  children: ReactNode
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isAuthPage = isPublicAuthPath(pathname)
  const isViewerPage = isPublicViewPath(pathname)
  const organizations = useQuery({
    ...organizationsQueryOptions(),
    enabled: !isAuthPage && !isViewerPage,
  })
  const setBrandColor = useCallback((brandColor: OrganizationBrandColor) => {
    applyOrganizationBrandColor(document.documentElement, brandColor)
    writeOrganizationBrandColorCookie(document, brandColor)
  }, [])
  const resolvedBrandColor = isAuthPage
    ? DEFAULT_ORGANIZATION_BRAND_COLOR
    : isViewerPage
      ? null
      : organizations.data
        ? organizationBrandColorForPath(pathname, organizations.data)
        : null

  useEffect(() => {
    if (resolvedBrandColor) setBrandColor(resolvedBrandColor)
  }, [resolvedBrandColor, setBrandColor])

  const value = useMemo(() => ({ setBrandColor }), [setBrandColor])

  return (
    <OrganizationBrandContext.Provider value={value}>
      <ScriptOnce>{INITIAL_ORGANIZATION_BRAND_SCRIPT}</ScriptOnce>
      {children}
    </OrganizationBrandContext.Provider>
  )
}

export function useOrganizationBrand(): OrganizationBrandContextValue {
  const context = useContext(OrganizationBrandContext)
  if (!context) {
    throw new Error(
      "useOrganizationBrand must be used within OrganizationBrandProvider"
    )
  }
  return context
}
