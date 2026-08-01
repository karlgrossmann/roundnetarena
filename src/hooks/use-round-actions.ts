import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useLeagueContext } from "@/components/league/LeagueContext"
import {
  annulRound,
  cancelOpenRoundGames,
  enterResult,
  setGameCancelled,
} from "@/lib/api/mutations"
import { DomainError } from "@/lib/domain-errors"
import { queryKeys } from "@/lib/api/queries"
import type { GameId, Round } from "@/lib/types"

/** Round update: takes the last known state and returns a new one, never mutating it. */
type RoundUpdate = (round: Round) => Promise<Round>

export interface RoundActions {
  enterResult: (gameId: GameId, pointsA: number, pointsB: number) => void
  setCancelled: (gameId: GameId, cancelled: boolean) => void
  /** Ends the still-open games; recorded results stay counted. */
  cancelOpen: () => void
  /** Cancels every game; the round is closed without scoring. */
  annul: () => void
  isPending: boolean
  isError: boolean
}

/**
 * Enter a result, cancel a game, undo a cancellation — all reversible until the round is
 * committed.
 *
 * The update is passed as a function and applied to the cache inside `mutationFn`: taps
 * at the edge of the court follow each other closely, and each must build on the result
 * of the previous one.
 */
export function useRoundActions(): RoundActions {
  const queryClient = useQueryClient()
  const league = useLeagueContext()

  const save = useMutation({
    mutationFn: async (update: RoundUpdate) => {
      const previous = queryClient.getQueryData<Round | null>(
        queryKeys.activeRound(league)
      )
      if (!previous) throw new DomainError("round.no_active_round")

      return update(previous)
    },
    onSuccess: (round) => {
      queryClient.setQueryData(queryKeys.activeRound(league), round)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.summary(league),
      })
    },
  })

  return {
    isPending: save.isPending,
    isError: save.isError,
    enterResult: (gameId, pointsA, pointsB) =>
      save.mutate((round) =>
        enterResult(league, { round, gameId, pointsA, pointsB })
      ),
    setCancelled: (gameId, cancelled) =>
      save.mutate((round) =>
        setGameCancelled(league, { round, gameId, cancelled })
      ),
    cancelOpen: () =>
      save.mutate((round) => cancelOpenRoundGames(league, round)),
    annul: () => save.mutate((round) => annulRound(league, round)),
  }
}
