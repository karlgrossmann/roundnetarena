import { TeamDisplay } from "./TeamDisplay"
import { RatingDelta } from "@/components/RatingDelta"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { gameStatusLabel } from "@/lib/round-view"
import { winnerOf } from "@/lib/score"
import { playerRefDisplayName } from "@/lib/player-display"
import type { Game, GameId, GameStatus, RatingChange } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  common_preview,
  game_cancel,
  game_correct,
  game_court,
  game_enter_result,
  game_uncancel,
} from "@/paraglide/messages.js"

interface GameCardBaseProps {
  game: Game
  /** Before the round is committed, rating changes are not binding. */
  preview: boolean
  disabled?: boolean
}

type GameCardProps = GameCardBaseProps &
  (
    | {
        readOnly: true
        onEnterResult?: never
        onCorrectResult?: never
        onCancel?: never
        onUncancel?: never
      }
    | {
        readOnly?: false
        onEnterResult: (gameId: GameId) => void
        onCorrectResult: (gameId: GameId) => void
        onCancel: (gameId: GameId) => void
        onUncancel: (gameId: GameId) => void
      }
  )

export function GameCard({
  game,
  preview,
  onEnterResult,
  onCorrectResult,
  onCancel,
  onUncancel,
  disabled = false,
  readOnly = false,
}: GameCardProps) {
  const sideActionLabel: Record<GameStatus, string> = {
    open: game_cancel(),
    finished: game_correct(),
    cancelled: game_uncancel(),
  }
  const sideAction = {
    open: () => onCancel?.(game.id),
    finished: () => onCorrectResult?.(game.id),
    cancelled: () => onUncancel?.(game.id),
  }[game.status]

  return (
    <Card
      className={cn(
        "gap-0",
        // Cancelled means: still visible, but no longer counted.
        game.status === "cancelled" && "opacity-60"
      )}
    >
      <CardContent className="flex items-center gap-2 pb-(--card-spacing)">
        <span className="font-heading text-sm font-medium">
          {game_court({ court: game.court })}
        </span>

        <StatusBadge status={game.status} />

        {!readOnly ? (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            disabled={disabled}
            onClick={sideAction}
          >
            {sideActionLabel[game.status]}
          </Button>
        ) : null}
      </CardContent>

      {/* No `pb` — the card provides the bottom spacing itself. On a finished game the
          strip below sets it via its `mt` instead. */}
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <TeamDisplay team={game.teamA} />
          <ScoreOrVersus game={game} />
          <TeamDisplay team={game.teamB} align="end" />
        </div>

        {game.status === "open" && !readOnly ? (
          <Button
            className="h-12 w-full"
            disabled={disabled}
            onClick={() => onEnterResult?.(game.id)}
          >
            {game_enter_result()}
          </Button>
        ) : null}
      </CardContent>

      {game.status === "finished" && game.result && (
        <RatingChangeStrip
          changes={game.result.ratingChanges}
          preview={preview}
        />
      )}
    </Card>
  )
}

function StatusBadge({ status }: { status: GameStatus }) {
  const label = gameStatusLabel(status)

  if (status === "finished") {
    return <Badge className="bg-success text-success-foreground">{label}</Badge>
  }

  return (
    <Badge
      variant="outline"
      className={cn(status === "cancelled" && "text-muted-foreground")}
    >
      {label}
    </Badge>
  )
}

function ScoreOrVersus({ game }: { game: Game }) {
  if (game.status !== "finished" || !game.result) {
    return (
      <span className="shrink-0 text-xs font-medium tracking-widest text-muted-foreground">
        VS
      </span>
    )
  }

  const { pointsA, pointsB } = game.result
  const winner = winnerOf(pointsA, pointsB)

  return (
    // The card is read at arm's length courtside — the score is the one thing on it
    // that has to carry over that distance.
    <span className="flex shrink-0 items-baseline gap-1 font-heading text-2xl tabular-nums">
      <span
        className={winner === "a" ? "font-semibold" : "text-muted-foreground"}
      >
        {pointsA}
      </span>
      <span className="text-muted-foreground">:</span>
      <span
        className={winner === "b" ? "font-semibold" : "text-muted-foreground"}
      >
        {pointsB}
      </span>
    </span>
  )
}

interface RatingChangeStripProps {
  changes: Array<RatingChange>
  preview: boolean
}

/**
 * Rating changes of all four players.
 *
 * A preview is muted, behind a dashed line and labelled as such: the difference from the
 * committed state has to be recognizable at a glance, otherwise committing the round
 * looks like a pointless extra step.
 */
function RatingChangeStrip({ changes, preview }: RatingChangeStripProps) {
  return (
    <div
      className={cn(
        "mt-(--card-spacing) -mb-(--card-spacing) flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-(--card-spacing) pt-3 pb-(--card-spacing)",
        preview && "border-dashed bg-muted/40"
      )}
    >
      {changes.map((change) => (
        <span key={change.player.id} className="flex items-center gap-1.5">
          <span className="text-xs font-medium">
            {playerRefDisplayName(change.player)}
          </span>
          <RatingDelta delta={change.delta} preview={preview} size="sm" />
        </span>
      ))}

      {preview && (
        <span className="ml-auto text-xs text-muted-foreground">
          {common_preview()}
        </span>
      )}
    </div>
  )
}
