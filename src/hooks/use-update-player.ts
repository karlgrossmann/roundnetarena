import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useLeagueContext } from "@/components/league/LeagueContext"
import { updatePlayer } from "@/lib/api/mutations"
import type { UpdatePlayerInput } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import type { PlayerId } from "@/lib/types"

/**
 * Renames a player or corrects their rating.
 *
 * The `players` key prefixes the detail, rating history and games of every player, so
 * one invalidation covers them all. Names also appear in the pool, the running round
 * and the history.
 */
export function useUpdatePlayer(playerId: PlayerId) {
  const queryClient = useQueryClient()
  const league = useLeagueContext()

  return useMutation({
    mutationFn: (input: UpdatePlayerInput) =>
      updatePlayer(league, playerId, input),
    onSuccess: (result) => {
      if (result.status !== "updated") return
      for (const queryKey of [
        queryKeys.players(league),
        queryKeys.summary(league),
        queryKeys.pool(league),
        queryKeys.activeRound(league),
        queryKeys.historyRoot(league),
      ]) {
        void queryClient.invalidateQueries({ queryKey })
      }
    },
  })
}
