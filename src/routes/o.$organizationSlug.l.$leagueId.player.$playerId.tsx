import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteError } from "@/components/RouteError"
import { PlayerDetail } from "@/components/player/PlayerDetail"
import { PlayerNotFound } from "@/components/player/PlayerNotFound"
import { PlayerSkeleton } from "@/components/player/PlayerSkeleton"
import {
  playerGamesQueryOptions,
  playerQueryOptions,
  playerRatingHistoryQueryOptions,
  playerRemovalPreviewQueryOptions,
  playersQueryOptions,
} from "@/lib/api/queries"
import { ensureLeagueRouteContext } from "@/lib/api/league-route"
import { isPlayerNotFound } from "@/lib/player-view"
import { localizedRouteHead } from "@/lib/i18n"
import { route_error_player } from "@/paraglide/messages.js"

export const Route = createFileRoute(
  "/o/$organizationSlug/l/$leagueId/player/$playerId"
)({
  staticData: { titleKey: "player" },
  head: () => localizedRouteHead("player"),
  loader: async ({ context, params }) => {
    const league = await ensureLeagueRouteContext(context.queryClient, params)
    // In parallel, not sequentially. The player list comes along because the rank is
    // derived from it.
    await Promise.all([
      context.queryClient.ensureQueryData(
        playerQueryOptions(league, params.playerId)
      ),
      context.queryClient.ensureQueryData(
        playerRatingHistoryQueryOptions(league, params.playerId, "six-months")
      ),
      context.queryClient.ensureQueryData(
        playerGamesQueryOptions(league, params.playerId, "six-months")
      ),
      context.queryClient.ensureQueryData(
        playerRemovalPreviewQueryOptions(league, params.playerId)
      ),
      context.queryClient.ensureQueryData(playersQueryOptions(league)),
    ])
  },
  pendingComponent: PlayerSkeleton,
  errorComponent: PlayerError,
  component: PlayerPage,
})

function PlayerPage() {
  const { playerId } = Route.useParams()

  return <PlayerDetail playerId={playerId} />
}

function PlayerError({ error, reset }: ErrorComponentProps) {
  if (isPlayerNotFound(error)) return <PlayerNotFound />

  return <RouteError description={route_error_player()} reset={reset} />
}
