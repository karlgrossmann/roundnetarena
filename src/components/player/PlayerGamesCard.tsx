import { useState } from "react"

import { PlayerGameRow } from "./PlayerGameRow"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { rangeDescription } from "@/lib/player-view"
import type { TimeRange } from "@/lib/time-range"
import type { PlayerGame } from "@/lib/types"
import {
  common_retry,
  player_games_empty,
  player_games_error,
  player_games_load_older,
  player_games_title,
} from "@/paraglide/messages.js"

interface PlayerGamesCardProps {
  /** Already filtered and sorted — see `filterPlayerGames()`. */
  games: Array<PlayerGame>
  range: TimeRange
  now: Date | null
  isPending?: boolean
  isError?: boolean
  onRetry?: () => void
}

const PAGE_SIZE = 10

/**
 * Game history, most recent game first.
 *
 * How many rows are expanded is tied to the time range: the caller passes the range as
 * the card's `key` so the list starts at the top again after a change.
 */
export function PlayerGamesCard({
  games,
  range,
  now,
  isPending = false,
  isError = false,
  onRetry,
}: PlayerGamesCardProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const visible = games.slice(0, visibleCount)
  const hasMore = games.length > visible.length

  return (
    <Card className="gap-0">
      <CardHeader className="pb-(--card-spacing)">
        <CardTitle>{player_games_title()}</CardTitle>
        <CardAction>
          <span className="text-xs text-muted-foreground">
            {rangeDescription(range)}
          </span>
        </CardAction>
      </CardHeader>

      {isPending ? (
        <CardContent className="flex flex-col gap-2 border-t pt-(--card-spacing) pb-(--card-spacing)">
          {Array.from({ length: 3 }, (_value, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </CardContent>
      ) : isError ? (
        <CardContent className="flex flex-col items-start gap-2 border-t pt-(--card-spacing) pb-(--card-spacing)">
          <p className="text-sm text-destructive">{player_games_error()}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            {common_retry()}
          </Button>
        </CardContent>
      ) : games.length === 0 ? (
        <CardContent className="pb-(--card-spacing)">
          <p className="text-sm text-muted-foreground">
            {player_games_empty()}
          </p>
        </CardContent>
      ) : (
        <ul className="divide-y border-t">
          {visible.map((game) => (
            <li key={game.gameId}>
              <PlayerGameRow game={game} now={now} />
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <CardFooter>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            {player_games_load_older()}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
