import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useMatches } from "@tanstack/react-router"

import { AccountMenu } from "./AccountMenu"
import { BrandLogo } from "./BrandLogo"
import { APP_NAV_ITEMS } from "./navigation"
import type { NavParams } from "./navigation"
import { Shell } from "./Shell"
import { OrganizationLogo } from "@/components/organization/OrganizationLogo"
import { useLeagueParams } from "@/hooks/use-league-params"
import { organizationsQueryOptions } from "@/lib/api/queries"
import { APP_NAME } from "@/lib/brand"
import { pageTitle } from "@/lib/i18n"

/**
 * Frame around every page of the signed-in area.
 *
 * The brand is the crest of the organization currently being worked in, not a fixed site
 * logo. In an application carrying several organizations, the crest is the only thing
 * that really names the context.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { title, backTo } = usePageHeading()
  const leagueParams = useLeagueParams()

  return (
    <Shell
      brand={<Brand leagueParams={leagueParams} />}
      title={title}
      backTo={backTo}
      nav={
        leagueParams
          ? { items: APP_NAV_ITEMS, params: leagueParams }
          : undefined
      }
      actions={<AccountMenu leagueParams={leagueParams} />}
    >
      {children}
    </Shell>
  )
}

/**
 * Crest of the active organization. The query shares its key with the organization menu,
 * so no second request is made.
 *
 * Without an organization — organization management, invitation, or not loaded yet — the
 * site logo stays. A placeholder that later turns into the crest would jump on load.
 */
function Brand({ leagueParams }: { leagueParams: NavParams | null }) {
  const organizations = useQuery({
    ...organizationsQueryOptions(),
    enabled: Boolean(leagueParams),
  })
  const organization = organizations.data?.find(
    (candidate) => candidate.slug === leagueParams?.organizationSlug
  )

  if (!organization) {
    return <BrandLogo className="size-9" />
  }

  return (
    <OrganizationLogo
      name={organization.name}
      logo={organization.logo}
      className="size-9"
    />
  )
}

/**
 * Page title and back target from the route's `staticData`.
 *
 * The last matching hit wins so that a deeper route can override a parent's title.
 */
function usePageHeading() {
  const matches = useMatches()

  const heading = [...matches]
    .reverse()
    .find((match) => match.staticData.titleKey !== undefined)

  return {
    title: heading?.staticData.titleKey
      ? pageTitle(heading.staticData.titleKey)
      : APP_NAME,
    backTo: heading?.staticData.backTo,
  }
}
