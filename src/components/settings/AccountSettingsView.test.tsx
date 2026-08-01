import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { queryKeys } from "@/lib/api/queries"

import { AccountSettingsView } from "./AccountSettingsView"

const mocks = vi.hoisted(() => ({
  requestPasswordResetEmail: vi.fn(),
}))

vi.mock("@/lib/auth-client", () => ({
  requestPasswordResetEmail: mocks.requestPasswordResetEmail,
}))

vi.mock("@/components/theme/ThemeSettings", () => ({
  ThemeSettings: () => null,
}))

vi.mock("@/components/language/LanguageSelect", () => ({
  LanguageSelect: () => null,
}))

describe("AccountSettingsView", () => {
  beforeEach(() => {
    mocks.requestPasswordResetEmail.mockReset()
    mocks.requestPasswordResetEmail.mockResolvedValue(undefined)
    setViewportWidth(1024)
  })

  it("requests the reset link for the signed-in email address", async () => {
    renderAccountSettings()

    fireEvent.click(screen.getByRole("button", { name: /Passwort/ }))
    expect(
      document.querySelector('[data-slot="dialog-content"]')
    ).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Link senden" }))

    await waitFor(() =>
      expect(mocks.requestPasswordResetEmail).toHaveBeenCalledWith(
        "alex@example.com"
      )
    )
    expect(await screen.findByText("Prüfe dein Postfach")).toBeDefined()
  })

  it("uses a drawer instead of a dialog on the phone", async () => {
    setViewportWidth(390)
    renderAccountSettings()

    fireEvent.click(screen.getByRole("button", { name: /Passwort/ }))

    await waitFor(() =>
      expect(
        document.querySelector('[data-slot="drawer-popup"]')
      ).not.toBeNull()
    )
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull()
  })
})

function renderAccountSettings() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  queryClient.setQueryData(queryKeys.account, {
    name: "Alex Morgan",
    email: "alex@example.com",
  })

  return render(<AccountSettingsView />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  })
}
