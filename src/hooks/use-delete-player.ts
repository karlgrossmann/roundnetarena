import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useLeagueContext } from "@/components/league/LeagueContext"
import { deletePlayer } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import type { Player } from "@/lib/types"

/**
 * Removes a player.
 *
 * The server decides whether the player is anonymised or deleted. History queries are
 * invalidated either way so an anonymised label shows up immediately.
 */
export function useDeletePlayer() {
  const queryClient = useQueryClient()
  const league = useLeagueContext()

  return useMutation({
    mutationFn: (player: Player) => deletePlayer(league, player),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.players(league),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.summary(league),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.pool(league) })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.activeRound(league),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.historyRoot(league),
      })
      queryClient.removeQueries({
        queryKey: queryKeys.player(league, result.id),
      })
    },
  })
}
