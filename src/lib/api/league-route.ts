import type { QueryClient } from "@tanstack/react-query"

import { DomainError } from "../domain-errors"
import type { LeagueContext, OrganizationSummary } from "../types"
import { leagueContextQueryOptions, organizationsQueryOptions } from "./queries"

export interface OrganizationSettingsRoute {
  to: "/o/$organizationSlug/l/$leagueId/settings"
  params: {
    organizationSlug: string
    leagueId: string
  }
  search: { tab: "organization" }
}

export async function ensureLeagueRouteContext(
  queryClient: QueryClient,
  params: { organizationSlug: string; leagueId: string }
): Promise<LeagueContext> {
  const organizations = await queryClient.ensureQueryData(
    organizationsQueryOptions()
  )
  const organization = organizations.find(
    (candidate) => candidate.slug === params.organizationSlug
  )
  if (!organization) throw new DomainError("league.not_found")

  return queryClient.ensureQueryData(
    leagueContextQueryOptions(
      organization.id,
      params.organizationSlug,
      params.leagueId
    )
  )
}

export function organizationSettingsRoute(
  organization: OrganizationSummary
): OrganizationSettingsRoute | null {
  if (!organization.defaultLeagueId) return null

  return {
    to: "/o/$organizationSlug/l/$leagueId/settings",
    params: {
      organizationSlug: organization.slug,
      leagueId: organization.defaultLeagueId,
    },
    search: { tab: "organization" },
  }
}

export function defaultLeagueHref(
  organizations: Array<OrganizationSummary>
): string {
  const organization =
    organizations.find(
      (candidate) => candidate.isActive && candidate.defaultLeagueId
    ) ?? organizations.find((candidate) => candidate.defaultLeagueId)
  if (!organization?.defaultLeagueId) return "/clubs"

  return `/o/${encodeURIComponent(organization.slug)}/l/${encodeURIComponent(organization.defaultLeagueId)}/`
}
