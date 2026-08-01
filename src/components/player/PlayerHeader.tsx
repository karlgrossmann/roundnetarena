import { PlayerAvatar } from "./PlayerAvatar"
import { RatingDelta } from "@/components/RatingDelta"
import { Card, CardContent } from "@/components/ui/card"
import { formatRating, formatWinPercentage } from "@/lib/format"
import { playerFullName, playerStandingLabel } from "@/lib/player-view"
import type { Player } from "@/lib/types"
import {
  player_stats_games,
  player_stats_pauses,
  player_stats_rate,
  player_stats_wins,
  player_total_change,
} from "@/paraglide/messages.js"

interface PlayerHeaderProps {
  player: Player
  /** Position in the rating-sorted list; `null` when unknown. */
  rank: number | null
}

export function PlayerHeader({ player, rank }: PlayerHeaderProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <PlayerAvatar
            firstName={player.firstName}
            lastName={player.lastName}
            size="lg"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-lg font-medium">
              {playerFullName(player)}
            </p>
            <p className="text-sm text-muted-foreground">
              {playerStandingLabel(rank, player.rd)}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end">
            <span className="font-heading text-2xl leading-none font-semibold tabular-nums">
              {formatRating(player.rating)}
            </span>
            <span className="mt-1 text-sm">
              <RatingDelta delta={player.totalRatingChange} />{" "}
              {player_total_change()}
            </span>
          </div>
        </div>

        {/* No card frames of their own: the stats belong to the header, not to four
            tiles of equal weight. */}
        <div className="grid grid-cols-4 gap-2">
          <Stat
            value={String(player.gamesPlayed)}
            label={player_stats_games()}
          />
          <Stat value={String(player.gamesWon)} label={player_stats_wins()} />
          <Stat
            value={formatWinPercentage(player.gamesWon, player.gamesPlayed)}
            label={player_stats_rate()}
          />
          <Stat
            value={String(player.gamesPaused)}
            label={player_stats_pauses()}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-heading text-lg leading-none font-semibold tabular-nums">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
