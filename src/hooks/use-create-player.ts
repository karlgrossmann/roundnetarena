import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useLeagueContext } from "@/components/league/LeagueContext"
import { createPlayer } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"

export function useCreatePlayer() {
  const queryClient = useQueryClient()
  const league = useLeagueContext()

  return useMutation({
    mutationFn: (input: Parameters<typeof createPlayer>[1]) =>
      createPlayer(league, input),
    onSuccess: (result) => {
      if (result.status !== "created") return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.players(league),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.summary(league),
      })
    },
  })
}
