import { useMemo, useState } from "react"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"

import { PlayerGamesCard } from "./PlayerGamesCard"
import { PlayerHeader } from "./PlayerHeader"
import { RatingHistoryCard } from "./RatingHistoryCard"
import { RemovePlayerCard } from "./RemovePlayerCard"
import { useLeagueContext } from "@/components/league/LeagueContext"
import { useNow } from "@/hooks/use-now"
import {
  playerGamesQueryOptions,
  playerQueryOptions,
  playerRatingHistoryQueryOptions,
  playerRemovalPreviewQueryOptions,
  playersQueryOptions,
} from "@/lib/api/queries"
import {
  filterPlayerGames,
  filterRatingPoints,
  playerRank,
} from "@/lib/player-view"
import { timeRangeKey } from "@/lib/time-range"
import type { TimeRange } from "@/lib/time-range"
import type { PlayerId } from "@/lib/types"

interface PlayerDetailProps {
  playerId: PlayerId
}

/**
 * Everything about one player in one place.
 *
 * The time range covers history and games together: both answer the same question — how
 * did it go lately? — and two selectors for it would be one too many. Six months is the
 * default because a rating trend barely shows below that.
 *
 * All data is already in the cache; the route loader fetched it.
 */
export function PlayerDetail({ playerId }: PlayerDetailProps) {
  const league = useLeagueContext()
  const { data: player } = useSuspenseQuery(
    playerQueryOptions(league, playerId)
  )
  const { data: players } = useSuspenseQuery(playersQueryOptions(league))
  const { data: removal } = useSuspenseQuery(
    playerRemovalPreviewQueryOptions(league, playerId)
  )

  const now = useNow()
  const [range, setRange] = useState<TimeRange>("six-months")
  const ratingHistory = useQuery(
    playerRatingHistoryQueryOptions(league, playerId, range)
  )
  const games = useQuery(playerGamesQueryOptions(league, playerId, range))

  const rank = useMemo(() => playerRank(players, playerId), [players, playerId])
  const points = useMemo(
    () => filterRatingPoints(ratingHistory.data ?? [], range, now),
    [ratingHistory.data, range, now]
  )
  const visibleGames = useMemo(
    () => filterPlayerGames(games.data ?? [], range, now),
    [games.data, range, now]
  )
  const rangeKey = timeRangeKey(range).join(":")

  return (
    <div className="flex flex-col gap-4">
      <PlayerHeader player={player} rank={rank} />

      <RatingHistoryCard
        points={points}
        range={range}
        onRangeChange={setRange}
        isPending={ratingHistory.isPending}
        isError={ratingHistory.isError}
        onRetry={() => void ratingHistory.refetch()}
      />

      {/* `key` resets the number of visible rows whenever the range changes — otherwise
          the list would stay expanded over entirely different content. */}
      <PlayerGamesCard
        key={rangeKey}
        games={visibleGames}
        range={range}
        now={now}
        isPending={games.isPending}
        isError={games.isError}
        onRetry={() => void games.refetch()}
      />

      <RemovePlayerCard player={player} removal={removal} />
    </div>
  )
}
