/**
 * Immutable updates to a running round.
 *
 * What `pool.ts` is for the pool, this file is for the round: every function returns a
 * new round and leaves the one passed in untouched. React Query compares by reference
 * — a mutated round would never reach the view.
 */

import { countByStatus } from "./round"
import type { DashboardSummary, Game, GameId, GameResult, Round } from "./types"

/** Replaces exactly one game. An unknown id leaves the round unchanged. */
function roundWithGame(
  round: Round,
  gameId: GameId,
  update: (game: Game) => Game
): Round {
  return {
    ...round,
    games: round.games.map((game) =>
      game.id === gameId ? update(game) : game
    ),
  }
}

/** Records a result. An existing one is replaced — correcting is the same operation as
 *  entering it the first time. */
export function roundWithResult(
  round: Round,
  gameId: GameId,
  result: GameResult
): Round {
  return roundWithGame(round, gameId, (game) => ({
    ...game,
    status: "finished",
    result,
  }))
}

/**
 * Cancelling and undoing a cancellation.
 *
 * An undone game returns to where it was: `finished` with a result, `open` without
 * one. Cancelling is only offered on open cards, but the rule must not depend on that
 * — otherwise a later UI change would silently lose a result.
 */
export function roundWithCancelled(
  round: Round,
  gameId: GameId,
  cancelled: boolean
): Round {
  return roundWithGame(round, gameId, (game) => ({
    ...game,
    status: cancelled ? "cancelled" : game.result ? "finished" : "open",
  }))
}

/**
 * Cancels every game of the round — for the session that falls through.
 *
 * Games with a result are cancelled too, otherwise the round would only be half
 * cancelled and still score in the end. The results stay attached to their games, so
 * undoing a single cancellation brings back the entered score unchanged.
 */
export function roundWithAllCancelled(round: Round): Round {
  return {
    ...round,
    games: round.games.map((game) => ({ ...game, status: "cancelled" })),
  }
}

/**
 * Nothing is calculated here: the deltas already sit on the results. The status change
 * is the actual operation — preview values become binding scores, irreversibly.
 */
export function committedRound(round: Round): Round {
  return { ...round, status: "committed" }
}

/**
 * Carries the active round's figures forward; `null` removes them.
 *
 * The dashboard shows a running round as a banner, so it has to learn about every
 * entered result and about the commit. A running round must never be invisible, and a
 * committed one must never linger.
 */
export function summaryForRound(
  summary: DashboardSummary,
  round: Round | null
): DashboardSummary {
  if (!round) return { ...summary, activeRound: undefined }

  return {
    ...summary,
    activeRound: {
      id: round.id,
      number: round.number,
      openGames: countByStatus(round.games, "open"),
      totalGames: round.games.length,
    },
  }
}
