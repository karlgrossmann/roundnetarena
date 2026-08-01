import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { queryKeys } from "@/lib/api/queries"
import { LeagueContextProvider } from "@/components/league/LeagueContext"
import { fixtureLeagueContext } from "@/lib/fixtures"
import { activeFixedTeams } from "@/lib/pool"
import type { PlayerRef, Pool } from "@/lib/types"

import { usePoolActions } from "./use-pool"

const mutationMocks = vi.hoisted(() => ({
  savePool: vi.fn(),
}))

vi.mock("@/lib/api/mutations", () => ({
  savePool: mutationMocks.savePool,
}))

const first: PlayerRef = { id: "p1", displayName: "Ada A.", rating: 1500 }
const second: PlayerRef = { id: "p2", displayName: "Berta B.", rating: 1500 }
const initialPool: Pool = {
  updatedAt: "2026-07-28T10:00:00.000Z",
  entries: [],
  fixedTeams: [],
}
const poolKey = queryKeys.pool(fixtureLeagueContext)

describe("usePoolActions", () => {
  beforeEach(() => {
    mutationMocks.savePool.mockReset()
  })

  it("applies rapid changes optimistically and saves them serially", async () => {
    const firstRequest = deferred<Pool>()
    const secondRequest = deferred<Pool>()
    mutationMocks.savePool
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise)
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData(poolKey, initialPool)
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <LeagueContextProvider value={fixtureLeagueContext}>
          {children}
        </LeagueContextProvider>
      </QueryClientProvider>
    )
    const { result } = renderHook(() => usePoolActions(), { wrapper })

    act(() => {
      result.current.setStatus(first, "playing")
      result.current.setStatus(second, "playing")
    })

    expect(
      queryClient
        .getQueryData<Pool>(poolKey)
        ?.entries.map((entry) => entry.player.id)
    ).toEqual(["p1", "p2"])
    await waitFor(() => expect(mutationMocks.savePool).toHaveBeenCalledTimes(1))
    expect(
      (mutationMocks.savePool.mock.calls[0][1] as Pool).entries.map(
        (entry) => entry.player.id
      )
    ).toEqual(["p1"])

    act(() => {
      firstRequest.resolve(mutationMocks.savePool.mock.calls[0][1] as Pool)
    })
    await waitFor(() => expect(mutationMocks.savePool).toHaveBeenCalledTimes(2))
    expect(
      (mutationMocks.savePool.mock.calls[1][1] as Pool).entries.map(
        (entry) => entry.player.id
      )
    ).toEqual(["p1", "p2"])
    expect(
      queryClient
        .getQueryData<Pool>(poolKey)
        ?.entries.map((entry) => entry.player.id)
    ).toEqual(["p1", "p2"])

    act(() => {
      secondRequest.resolve(mutationMocks.savePool.mock.calls[1][1] as Pool)
    })
    await waitFor(() => expect(result.current.isError).toBe(false))
  })

  it("keeps a fixed team while a player is away and reactivates it on return", async () => {
    mutationMocks.savePool.mockImplementation(
      async (_league: unknown, pool: Pool) => pool
    )
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData<Pool>(poolKey, {
      ...initialPool,
      entries: [
        { player: first, status: "playing" },
        { player: second, status: "playing" },
      ],
      fixedTeams: [{ id: "team", players: ["p1", "p2"] }],
    })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <LeagueContextProvider value={fixtureLeagueContext}>
          {children}
        </LeagueContextProvider>
      </QueryClientProvider>
    )
    const { result } = renderHook(() => usePoolActions(), { wrapper })

    act(() => {
      result.current.setStatus(first, "absent")
    })

    await waitFor(() => expect(mutationMocks.savePool).toHaveBeenCalledTimes(1))
    const inactive = mutationMocks.savePool.mock.calls[0][1] as Pool
    expect(inactive.fixedTeams).toEqual([{ id: "team", players: ["p1", "p2"] }])
    expect(activeFixedTeams(inactive)).toEqual([])

    await waitFor(() => expect(result.current.isError).toBe(false))
    act(() => {
      result.current.setStatus(first, "playing")
    })

    await waitFor(() => expect(mutationMocks.savePool).toHaveBeenCalledTimes(2))
    const reactivated = mutationMocks.savePool.mock.calls[1][1] as Pool
    expect(activeFixedTeams(reactivated)).toEqual(reactivated.fixedTeams)
  })
})

function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolvePromise: ((value: T) => void) | undefined
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve
  })
  return {
    promise,
    resolve: (value) => resolvePromise?.(value),
  }
}
