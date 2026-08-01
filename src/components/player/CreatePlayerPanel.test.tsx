import type { ReactNode } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CreatePlayerPanel } from "./CreatePlayerPanel"
import { LeagueContextProvider } from "@/components/league/LeagueContext"
import { fixtureLeagueContext } from "@/lib/fixtures"

const mutation = vi.hoisted(() => ({
  mutate: vi.fn(),
  reset: vi.fn(),
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

vi.mock("@/hooks/use-create-player", () => ({
  useCreatePlayer: () => ({
    ...mutation,
    isError: false,
    isPending: false,
  }),
}))

describe("CreatePlayerPanel", () => {
  beforeEach(() => {
    mutation.mutate.mockReset()
    mutation.reset.mockReset()
  })

  it("keeps the dialog open on a name conflict and links the existing player", () => {
    mutation.mutate.mockImplementationOnce(
      (
        _input: unknown,
        options: {
          onSuccess: (result: {
            status: "conflict"
            error: {
              code: "PLAYER_NAME_CONFLICT"
              existingPlayerId: string
            }
          }) => void
        }
      ) => {
        options.onSuccess({
          status: "conflict",
          error: {
            code: "PLAYER_NAME_CONFLICT",
            existingPlayerId: "player_existing",
          },
        })
      }
    )
    const onOpenChange = vi.fn()
    const onCreated = vi.fn()

    renderWithLeague(
      <CreatePlayerPanel
        open
        onOpenChange={onOpenChange}
        initialRating={1500}
        initialRd={125}
        onCreated={onCreated}
      />
    )

    fireEvent.change(screen.getByLabelText("Vorname"), {
      target: { value: "Mara" },
    })
    fireEvent.change(screen.getByLabelText("Nachname"), {
      target: { value: "Sommer" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Anlegen" }))

    expect(
      screen.getByText(/ist in dieser Liga bereits angelegt/)
    ).toBeDefined()
    expect(
      screen
        .getByRole("link", { name: "Vorhandenen Spieler öffnen" })
        .getAttribute("href")
    ).toBe("/player/player_existing")
    expect(onCreated).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("takes over the league defaults and allows an individual override", () => {
    renderWithLeague(
      <CreatePlayerPanel
        open
        onOpenChange={vi.fn()}
        initialRating={1725}
        initialRd={100}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Erweitert" }))
    const rating = screen.getByLabelText("Start-Rating")
    const rd = screen.getByLabelText("Start-RD")
    expect((rating as HTMLInputElement).value).toBe("1725")
    expect((rd as HTMLInputElement).value).toBe("100")

    fireEvent.change(screen.getByLabelText("Vorname"), {
      target: { value: "Mara" },
    })
    fireEvent.change(screen.getByLabelText("Nachname"), {
      target: { value: "Sommer" },
    })
    fireEvent.change(rating, { target: { value: "1800" } })
    fireEvent.change(rd, { target: { value: "90" } })
    fireEvent.click(screen.getByRole("button", { name: "Anlegen" }))

    expect(mutation.mutate.mock.calls[0]?.[0]).toEqual({
      firstName: "Mara",
      lastName: "Sommer",
      rating: 1800,
      rd: 90,
    })
  })
})

function renderWithLeague(node: ReactNode) {
  return render(
    <LeagueContextProvider value={fixtureLeagueContext}>
      {node}
    </LeagueContextProvider>
  )
}
