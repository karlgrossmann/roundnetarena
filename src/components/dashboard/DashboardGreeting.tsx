import { useSuspenseQuery } from "@tanstack/react-query"

import { useLeagueContext } from "@/components/league/LeagueContext"
import { OrganizationHeader } from "@/components/organization/OrganizationHeader"
import { useNow } from "@/hooks/use-now"
import {
  accountQueryOptions,
  organizationsQueryOptions,
} from "@/lib/api/queries"
import { formatGreeting } from "@/lib/greeting"

/**
 * Head of the dashboard: organization large, greeting as the subline.
 *
 * Both queries sit in the route's `loader` — the organization list also shares its key
 * with the brand in the header bar, so no second request is made.
 */
export function DashboardGreeting() {
  const league = useLeagueContext()
  const { data: account } = useSuspenseQuery(accountQueryOptions())
  const { data: organizations } = useSuspenseQuery(organizationsQueryOptions())
  const now = useNow()

  const organization = organizations.find(
    (candidate) => candidate.slug === league.organizationSlug
  )

  return (
    <OrganizationHeader
      name={league.organizationName}
      logo={organization?.logo ?? null}
      subline={formatGreeting(account.name, now)}
    />
  )
}
