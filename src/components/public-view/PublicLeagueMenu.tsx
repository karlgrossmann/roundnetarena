import { usePublicViewContext } from "./PublicViewContext"
import { LeagueSubMenu } from "@/components/league/LeagueSubMenu"

/** League switcher in the public view — the same presentation as for members, only
 *  without player counts and without the create entry. */
export function PublicLeagueMenu() {
  const view = usePublicViewContext()

  return (
    <LeagueSubMenu
      activeLeagueId={view.leagueId}
      activeName={view.leagueName}
      entries={view.leagues.map((league) => ({
        id: league.id,
        name: league.name,
      }))}
      link={(id) => ({
        to: "/view/$organizationSlug/l/$leagueId",
        params: { organizationSlug: view.organizationSlug, leagueId: id },
      })}
    />
  )
}
