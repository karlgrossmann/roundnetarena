import { useState } from "react"

import { MatchExplanationCard } from "./MatchExplanationCard"
import { PausingCard } from "./PausingCard"
import { RoundCancellationActions } from "./RoundCancellationActions"
import { RoundProgressCard } from "./RoundProgressCard"
import { GameCard } from "@/components/game/GameCard"
import { ScoreSheet } from "@/components/game/ScoreSheet"
import { StickyActionBar } from "@/components/layout/StickyActionBar"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useCommitRound } from "@/hooks/use-commit-round"
import { useRoundActions } from "@/hooks/use-round-actions"
import { canCommitRound, countByStatus } from "@/lib/round"
import {
  commitHint,
  isRoundWithoutScoring,
  sortGamesByCourt,
} from "@/lib/round-view"
import type { GameId, Round } from "@/lib/types"
import {
  round_change_error,
  round_commit,
  round_commit_error,
  round_commit_pending,
} from "@/paraglide/messages.js"

interface ActiveRoundProps {
  round: Round
  /** Runs after the commit — the page then shows the result. */
  onCommitted: (round: Round) => void
}

/**
 * `/round` with a running round: the app's most used view.
 *
 * Operated at the edge of the court, standing, often one-handed. Everything before the
 * commit is a preview and reversible — ratings change only on commit.
 */
export function ActiveRound({ round, onCommitted }: ActiveRoundProps) {
  const actions = useRoundActions()
  const commit = useCommitRound()

  const [editingId, setEditingId] = useState<GameId | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Read from the round instead of cached, so reopening the sheet shows the stored score.
  const editingGame = round.games.find((game) => game.id === editingId) ?? null

  function openSheet(gameId: GameId) {
    setEditingId(gameId)
    setSheetOpen(true)
  }

  function handleSubmit(pointsA: number, pointsB: number) {
    if (!editingGame) return

    actions.enterResult(editingGame.id, pointsA, pointsB)
    setSheetOpen(false)
  }

  const canCommit = canCommitRound(round)
  const isBusy = actions.isPending || commit.isPending

  return (
    <div className="flex flex-col gap-4">
      <RoundProgressCard
        round={round}
        action={
          <RoundCancellationActions
            openGames={countByStatus(round.games, "open")}
            alreadyAnnulled={isRoundWithoutScoring(round)}
            onCancelOpen={actions.cancelOpen}
            onAnnul={actions.annul}
            disabled={isBusy}
          />
        }
      />

      {actions.isError && (
        <Alert variant="destructive">
          <AlertTitle>{round_change_error()}</AlertTitle>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {sortGamesByCourt(round.games).map((game) => (
          <GameCard
            key={game.id}
            game={game}
            // While the round runs, every rating change is provisional.
            preview
            disabled={isBusy}
            onEnterResult={openSheet}
            onCorrectResult={openSheet}
            onCancel={(gameId) => actions.setCancelled(gameId, true)}
            onUncancel={(gameId) => actions.setCancelled(gameId, false)}
          />
        ))}
      </div>

      <PausingCard pausing={round.pausing} />

      {round.explanation && (
        <MatchExplanationCard
          explanation={round.explanation}
          players={round.games.flatMap((game) => [
            ...game.teamA.players,
            ...game.teamB.players,
          ])}
        />
      )}

      {commit.isError && (
        <Alert variant="destructive">
          <AlertTitle>{round_commit_error()}</AlertTitle>
        </Alert>
      )}

      <StickyActionBar hint={commitHint(round)}>
        <Button
          size="lg"
          className="h-12 w-full"
          disabled={!canCommit || isBusy}
          onClick={() => commit.mutate(round, { onSuccess: onCommitted })}
        >
          {commit.isPending ? round_commit_pending() : round_commit()}
        </Button>
      </StickyActionBar>

      <ScoreSheet
        game={editingGame}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
