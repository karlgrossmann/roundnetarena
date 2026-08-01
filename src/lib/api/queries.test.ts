import { describe, expect, it } from "vitest"

import { defaultLeagueHref, organizationSettingsRoute } from "./league-route"
import { queryKeys } from "./queries"
import type { OrganizationSummary } from "../types"

describe("tenant query keys", () => {
  it("separates the same league value across clubs and across leagues", () => {
    const first = {
      organizationId: "00000000-0000-4000-8000-000000000001",
      leagueId: "league_shared",
    }
    const otherOrganization = {
      ...first,
      organizationId: "00000000-0000-4000-8000-000000000002",
    }
    const otherLeague = { ...first, leagueId: "league_other" }

    expect(queryKeys.players(first)).not.toEqual(
      queryKeys.players(otherOrganization)
    )
    expect(queryKeys.players(first)).not.toEqual(queryKeys.players(otherLeague))
    expect(queryKeys.pool(first)).not.toEqual(queryKeys.settings(first))
  })

  it("builds a complete, bookmarkable default path", () => {
    const organization: OrganizationSummary = {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Roundnet Bielefeld",
      slug: "roundnet-bielefeld",
      logo: null,
      brandColor: "purple",
      role: "owner",
      isActive: true,
      provisioned: true,
      defaultLeagueId: "league_default",
    }

    expect(defaultLeagueHref([organization])).toBe(
      "/o/roundnet-bielefeld/l/league_default/"
    )
    expect(organizationSettingsRoute(organization)).toEqual({
      to: "/o/$organizationSlug/l/$leagueId/settings",
      params: {
        organizationSlug: "roundnet-bielefeld",
        leagueId: "league_default",
      },
      search: { tab: "organization" },
    })
    expect(
      organizationSettingsRoute({ ...organization, defaultLeagueId: null })
    ).toBeNull()
  })

  it("separates audit pages and clubs", () => {
    const firstOrganizationId = "00000000-0000-4000-8000-000000000001"
    const otherOrganizationId = "00000000-0000-4000-8000-000000000002"

    expect(queryKeys.organizationAudit(firstOrganizationId, 1)).not.toEqual(
      queryKeys.organizationAudit(firstOrganizationId, 2)
    )
    expect(queryKeys.organizationAudit(firstOrganizationId, 1)).not.toEqual(
      queryKeys.organizationAudit(otherOrganizationId, 1)
    )
  })

  it("separates public caches by slug, league and data kind", () => {
    const first = {
      organizationSlug: "roundnet-bielefeld",
      leagueId: "league_one",
    }
    const otherLeague = { ...first, leagueId: "league_two" }
    const otherOrganization = { ...first, organizationSlug: "other-club" }

    expect(queryKeys.publicViewDashboard(first)).not.toEqual(
      queryKeys.publicViewDashboard(otherLeague)
    )
    expect(queryKeys.publicViewDashboard(first)).not.toEqual(
      queryKeys.publicViewDashboard(otherOrganization)
    )
    expect(queryKeys.publicViewDashboard(first)).not.toEqual(
      queryKeys.publicViewActiveRound(first)
    )
  })
})
