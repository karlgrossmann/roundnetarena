import { fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"

import { LeagueContextProvider } from "@/components/league/LeagueContext"
import { fixtureLeagueContext } from "@/lib/fixtures"
import { queryKeys } from "@/lib/api/queries"

import { SettingsView } from "./SettingsView"

vi.mock("@/components/theme/ThemeSettings", () => ({
  ThemeSettings: () => null,
}))

vi.mock("@/components/language/LanguageSelect", () => ({
  LanguageSelect: () => null,
}))

describe("SettingsView", () => {
  it("opens on the account tab and reports tab changes back typed", () => {
    const onTabChange = vi.fn()
    const queryClient = new QueryClient()
    queryClient.setQueryData(queryKeys.account, {
      name: "Alex Morgan",
      email: "alex@example.com",
    })

    render(
      <QueryClientProvider client={queryClient}>
        <LeagueContextProvider value={fixtureLeagueContext}>
          <SettingsView tab="account" onTabChange={onTabChange} />
        </LeagueContextProvider>
      </QueryClientProvider>
    )

    expect(
      screen.getByRole("tab", { name: "Account" }).getAttribute("aria-selected")
    ).toBe("true")
    expect(screen.getByText("alex@example.com")).toBeDefined()

    fireEvent.click(screen.getByRole("tab", { name: "Verein" }))
    expect(onTabChange).toHaveBeenCalledWith("organization")
  })
})
