import { IconPlus } from "@/components/icons"
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "@tanstack/react-router"

import { LeagueSubMenu } from "./LeagueSubMenu"
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  leaguesQueryOptions,
  organizationsQueryOptions,
} from "@/lib/api/queries"
import { hasOrganizationPermission } from "@/lib/organization-permissions"
import { league_create } from "@/paraglide/messages.js"

export function LeagueMenu() {
  const params = useParams({ strict: false })
  const organizationSlug =
    "organizationSlug" in params ? params.organizationSlug : undefined
  const leagueId = "leagueId" in params ? params.leagueId : undefined
  const organizations = useQuery(organizationsQueryOptions())
  const organization = organizations.data?.find(
    (candidate) => candidate.slug === organizationSlug
  )
  const leagues = useQuery({
    ...leaguesQueryOptions(organization?.id ?? ""),
    enabled: Boolean(organization),
  })

  if (!organizationSlug || !leagueId) return null
  if (organizations.isPending || leagues.isPending) {
    return (
      <div className="px-1.5 py-1">
        <Skeleton className="h-5 w-full" />
      </div>
    )
  }

  const active = leagues.data?.find((league) => league.id === leagueId)
  if (!organization || !active) return null

  return (
    <LeagueSubMenu
      activeLeagueId={leagueId}
      activeName={active.name}
      entries={
        leagues.data?.map((league) => ({
          id: league.id,
          name: league.name,
          playerCount: league.playerCount,
        })) ?? []
      }
      link={(id) => ({
        to: "/o/$organizationSlug/l/$leagueId",
        params: { organizationSlug, leagueId: id },
      })}
      footer={
        hasOrganizationPermission(organization.role, "league:manage") ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <Link
                  to="/o/$organizationSlug/l/$leagueId/leagues/new"
                  params={{ organizationSlug, leagueId }}
                />
              }
            >
              <IconPlus />
              {league_create()}
            </DropdownMenuItem>
          </>
        ) : null
      }
    />
  )
}
