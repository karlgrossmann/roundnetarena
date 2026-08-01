import { useEffect } from "react"
import type { ReactNode } from "react"
import { IconEye } from "@/components/icons"

import { usePublicViewContext } from "./PublicViewContext"
import { PublicViewMenu } from "./PublicViewMenu"
import { PUBLIC_NAV_ITEMS } from "@/components/layout/navigation"
import { Shell } from "@/components/layout/Shell"
import { useOrganizationBrand } from "@/components/organization/OrganizationBrandProvider"
import { OrganizationLogo } from "@/components/organization/OrganizationLogo"
import { Badge } from "@/components/ui/badge"
import { public_view_badge } from "@/paraglide/messages.js"

/**
 * Frame of the public view. Structure and building blocks are the same as for members —
 * only the brand additionally carries the hint that nothing can be changed here.
 */
export function PublicViewShell({ children }: { children: ReactNode }) {
  const view = usePublicViewContext()
  const { setBrandColor } = useOrganizationBrand()

  useEffect(() => {
    setBrandColor(view.brandColor)
  }, [setBrandColor, view.brandColor])

  return (
    <Shell
      brand={
        <OrganizationLogo
          name={view.organizationName}
          logo={view.organizationLogo}
          className="size-9"
        />
      }
      title={view.organizationName}
      badge={<ViewOnlyBadge />}
      nav={{
        items: PUBLIC_NAV_ITEMS,
        params: {
          organizationSlug: view.organizationSlug,
          leagueId: view.leagueId,
        },
      }}
      actions={<PublicViewMenu />}
    >
      {children}
    </Shell>
  )
}

/**
 * The read-only hint, visible at every width.
 *
 * Below `sm` as an eye without text: right at the court — where someone tries in vain to
 * enter a result — the explanation is needed most and there is the least room for it.
 */
function ViewOnlyBadge() {
  return (
    <>
      <Badge
        variant="secondary"
        aria-label={public_view_badge()}
        className="shrink-0 sm:hidden"
      >
        <IconEye className="size-3.5" />
      </Badge>
      <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
        {public_view_badge()}
      </Badge>
    </>
  )
}
