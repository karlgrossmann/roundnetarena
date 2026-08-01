import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { queryKeys } from "@/lib/api/queries"
import { LeagueContextProvider } from "@/components/league/LeagueContext"
import { fixtureLeagueContext } from "@/lib/fixtures"
import type { Settings } from "@/lib/types"

import { useSaveSettings } from "./use-save-settings"

const mocks = vi.hoisted(() => ({
  saveSettings: vi.fn(),
  toastAdd: vi.fn(),
}))

vi.mock("@/lib/api/mutations", () => ({
  saveSettings: mocks.saveSettings,
}))

vi.mock("@/components/ui/toast", () => ({
  toast: { add: mocks.toastAdd },
}))

const initialSettings: Settings = {
  matchingAlgorithm: "default",
  higherRatingWeight: 2,
  pauseMode: "random",
  initialRating: 1500,
  initialRd: 125,
  table: {
    columns: ["rating", "rd"],
    sortBy: "rating",
    colorRatingChange: true,
  },
}
const settingsKey = queryKeys.settings(fixtureLeagueContext)

describe("useSaveSettings", () => {
  beforeEach(() => {
    mocks.saveSettings.mockReset()
    mocks.toastAdd.mockReset()
  })

  it("writes only the complete server state into the cache", async () => {
    const saved = { ...initialSettings, initialRating: 1725, initialRd: 100 }
    mocks.saveSettings.mockResolvedValue(saved)
    const { queryClient, wrapper } = setup()
    const { result } = renderHook(() => useSaveSettings(), { wrapper })

    act(() => result.current.mutate(saved))

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData(settingsKey)).toEqual(saved)
  })

  it("keeps the previous cache value on a server error and reports it", async () => {
    mocks.saveSettings.mockRejectedValue(new Error("Invalid initial values."))
    const { queryClient, wrapper } = setup()
    const { result } = renderHook(() => useSaveSettings(), { wrapper })

    act(() =>
      result.current.mutate({
        ...initialSettings,
        initialRating: 1725,
        initialRd: 100,
      })
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(queryClient.getQueryData(settingsKey)).toEqual(initialSettings)
    expect(mocks.toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Nicht gespeichert" })
    )
  })
})

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  queryClient.setQueryData(settingsKey, initialSettings)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <LeagueContextProvider value={fixtureLeagueContext}>
        {children}
      </LeagueContextProvider>
    </QueryClientProvider>
  )

  return { queryClient, wrapper }
}
