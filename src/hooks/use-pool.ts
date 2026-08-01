import { useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useLeagueContext } from "@/components/league/LeagueContext"
import { savePool } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import {
  clearedPool,
  poolWithAllPlaying,
  poolWithStatus,
  withFixedTeam,
  withoutFixedTeam,
} from "@/lib/pool"
import type { Player, PlayerRef, Pool, PoolStatus } from "@/lib/types"

/** Pool update: takes the last known state and returns a new one, never mutating it. */
type PoolUpdate = (previous: Pool) => Pool
interface PoolMutation {
  pool: Pool
  previous: Pool
  revision: number
}

export interface PoolActions {
  setStatus: (player: PlayerRef, status: PoolStatus) => void
  addAll: (players: Array<Player>) => void
  clear: () => void
  setFixedTeam: (first: PlayerRef, second: PlayerRef) => void
  removeFixedTeam: (teamId: string) => void
  isError: boolean
}

/**
 * Pool actions: toggle a single tile, add everyone, clear.
 *
 * Every update is applied to the cache immediately, while the server calls run serially.
 * Responses from older revisions must not overwrite a newer optimistic state.
 */
export function usePoolActions(): PoolActions {
  const queryClient = useQueryClient()
  const league = useLeagueContext()
  const latestRevision = useRef(0)

  const save = useMutation({
    scope: { id: "pool" },
    mutationFn: ({ pool }: PoolMutation) => savePool(league, pool),
    onSuccess: (pool, mutation) => {
      if (mutation.revision === latestRevision.current) {
        queryClient.setQueryData(queryKeys.pool(league), pool)
      }
    },
    onError: (_error, mutation) => {
      if (mutation.revision === latestRevision.current) {
        queryClient.setQueryData(queryKeys.pool(league), mutation.previous)
      }
    },
  })

  function nowIso(): string {
    // In the event handler, not during render — there it would be an SSR pitfall.
    return new Date().toISOString()
  }

  function apply(update: PoolUpdate): void {
    const previous = queryClient.getQueryData<Pool>(queryKeys.pool(league))
    if (!previous) return

    const pool = update(previous)
    const revision = latestRevision.current + 1
    latestRevision.current = revision
    queryClient.setQueryData(queryKeys.pool(league), pool)
    save.mutate({ pool, previous, revision })
  }

  return {
    isError: save.isError,
    setStatus: (player, status) =>
      apply((previous) => poolWithStatus(previous, player, status, nowIso())),
    addAll: (players) =>
      apply((previous) => poolWithAllPlaying(previous, players, nowIso())),
    clear: () => apply(() => clearedPool(nowIso())),
    setFixedTeam: (first, second) =>
      apply((previous) => withFixedTeam(previous, first, second, nowIso())),
    removeFixedTeam: (teamId) =>
      apply((previous) => withoutFixedTeam(previous, teamId, nowIso())),
  }
}
