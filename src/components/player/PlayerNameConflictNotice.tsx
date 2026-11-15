import { Link } from "@tanstack/react-router"

import { useLeagueContext } from "@/components/league/LeagueContext"
import type { PlayerId } from "@/lib/types"
import {
  player_name_conflict,
  player_open_existing,
} from "@/paraglide/messages.js"

/** The name is taken in this league — points at the person who already has it. */
export function PlayerNameConflictNotice({ playerId }: { playerId: PlayerId }) {
  const league = useLeagueContext()

  return (
    <p role="alert" className="text-sm text-destructive">
      {player_name_conflict()}{" "}
      <Link
        to="/o/$organizationSlug/l/$leagueId/player/$playerId"
        params={{
          organizationSlug: league.organizationSlug,
          leagueId: league.id,
          playerId,
        }}
        className="font-medium underline underline-offset-4"
      >
        {player_open_existing()}
      </Link>
    </p>
  )
}
