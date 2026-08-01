import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useLeagueContext } from "@/components/league/LeagueContext"
import { commitRound } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"

/**
 * Commits the active round.
 *
 * The only operation that changes ratings, and the only irreversible one. Afterwards no
 * round is active any more.
 */
export function useCommitRound() {
  const queryClient = useQueryClient()
  const league = useLeagueContext()

  return useMutation({
    mutationFn: (round: Parameters<typeof commitRound>[1]) =>
      commitRound(league, round),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.activeRound(league), null)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.summary(league),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.players(league),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.historyRoot(league),
      })
    },
  })
}
