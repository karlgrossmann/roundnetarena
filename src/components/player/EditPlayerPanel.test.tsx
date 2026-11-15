import type { ReactNode } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EditPlayerPanel } from "./EditPlayerPanel"
import { LeagueContextProvider } from "@/components/league/LeagueContext"
import { fixtureLeagueContext, makePlayer } from "@/lib/fixtures"

const mutation = vi.hoisted(() => ({
  mutate: vi.fn(),
  isError: false,
  error: null as Error | null,
}))

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    params,
  }: {
    children: ReactNode
    params: { playerId: string }
  }) => <a href={`/player/${params.playerId}`}>{children}</a>,
}))

vi.mock("@/hooks/use-update-player", () => ({
  useUpdatePlayer: () => ({ ...mutation, isPending: false }),
}))

const player = makePlayer({ rating: 1631, rd: 52 })

describe("EditPlayerPanel", () => {
  beforeEach(() => {
    mutation.mutate.mockReset()
    mutation.isError = false
    mutation.error = null
  })

  it("starts from the current values and sends only what changed", () => {
    const onOpenChange = vi.fn()
    mutation.mutate.mockImplementationOnce(
      (_input: unknown, options: { onSuccess: (result: unknown) => void }) =>
        options.onSuccess({ status: "updated", player })
    )
    renderPanel(onOpenChange)

    const firstName = screen.getByLabelText<HTMLInputElement>("Vorname")
    expect(firstName.value).toBe("Klara")
    expect(screen.getByLabelText<HTMLInputElement>("Rating").value).toBe("1631")

    fireEvent.change(firstName, { target: { value: "Clara" } })
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }))

    expect(mutation.mutate.mock.calls[0]?.[0]).toEqual({
      firstName: "Clara",
      lastName: "Nowak",
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("stays open on a name conflict and links the existing player", () => {
    const onOpenChange = vi.fn()
    mutation.mutate.mockImplementationOnce(
      (_input: unknown, options: { onSuccess: (result: unknown) => void }) =>
        options.onSuccess({
          status: "conflict",
          error: {
            code: "PLAYER_NAME_CONFLICT",
            existingPlayerId: "player_existing",
          },
        })
    )
    renderPanel(onOpenChange)

    fireEvent.click(screen.getByRole("button", { name: "Speichern" }))

    expect(
      screen
        .getByRole("link", { name: "Vorhandenen Spieler öffnen" })
        .getAttribute("href")
    ).toBe("/player/player_existing")
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("explains why the rating is locked during a running round", () => {
    mutation.isError = true
    mutation.error = new Error("player.rating_locked_in_round")
    renderPanel(vi.fn())

    expect(screen.getByRole("alert").textContent).toMatch(/laufenden Runde/)
  })
})

function renderPanel(onOpenChange: (open: boolean) => void) {
  return render(
    <LeagueContextProvider value={fixtureLeagueContext}>
      <EditPlayerPanel player={player} open onOpenChange={onOpenChange} />
    </LeagueContextProvider>
  )
}
