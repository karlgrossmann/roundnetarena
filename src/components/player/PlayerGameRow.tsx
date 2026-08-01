import { RatingDelta } from "@/components/RatingDelta"
import { formatScore } from "@/lib/format"
import { gameDelta, gameMomentLabel } from "@/lib/player-view"
import { cn } from "@/lib/utils"
import { playerRefDisplayName } from "@/lib/player-display"
import type { PlayerGame } from "@/lib/types"
import {
  player_game_loss,
  player_game_loss_short,
  player_game_opponents,
  player_game_win,
  player_game_win_short,
} from "@/paraglide/messages.js"

interface PlayerGameRowProps {
  game: PlayerGame
  /** Current time for "today"; `null` before hydration. */
  now: Date | null
}

/**
 * One game from the viewed player's perspective.
 *
 * "with X against Y & Z" reads faster than four listed names because it answers the
 * question people actually have: with whom, against whom?
 */
export function PlayerGameRow({ game, now }: PlayerGameRowProps) {
  const [first, second] = game.opponents

  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
      <span
        aria-label={game.won ? player_game_win() : player_game_loss()}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold",
          game.won ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        )}
      >
        {game.won ? player_game_win_short() : player_game_loss_short()}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {player_game_opponents({
            partner: playerRefDisplayName(game.partner),
            first: playerRefDisplayName(first),
            second: playerRefDisplayName(second),
          })}
        </p>
        <p className="text-xs text-muted-foreground">
          {gameMomentLabel(game.timestamp, now)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end">
        <span className="text-sm font-medium tabular-nums">
          {formatScore(game.ownPoints, game.opponentPoints)}
        </span>
        <RatingDelta delta={gameDelta(game)} size="sm" />
      </div>
    </div>
  )
}
