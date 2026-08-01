import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useLeagueContext } from "@/components/league/LeagueContext"
import { generateRound } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import type { Round } from "@/lib/types"

/**
 * Turns the pool into the active round.
 *
 * `summary` is invalidated too because the dashboard shows the active round as a banner
 * — an active round must never be invisible, or results get lost. Ratings stay untouched
 * until the round is committed.
 */
export function useGenerateRound() {
  const queryClient = useQueryClient()
  const league = useLeagueContext()

  return useMutation({
    mutationFn: (input: Parameters<typeof generateRound>[1]) =>
      generateRound(league, input),
    onSuccess: (round: Round) => {
      queryClient.setQueryData(queryKeys.activeRound(league), round)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.summary(league),
      })
    },
  })
}
