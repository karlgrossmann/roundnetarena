import { fireEvent, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { RemovePlayerCard } from "./RemovePlayerCard"
import { LeagueContextProvider } from "@/components/league/LeagueContext"
import { fixtureLeagueContext } from "@/lib/fixtures"
import type { Player } from "@/lib/types"

const mutate = vi.fn()
const navigate = vi.fn()

vi.mock("@/hooks/use-delete-player", () => ({
  useDeletePlayer: () => ({
    mutate,
    isError: false,
    isPending: false,
  }),
}))

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}))

const player: Player = {
  id: "player_0123456789abcdef",
  firstName: "Klara",
  lastName: "Nowak",
  displayName: "Klara N.",
  rating: 1631,
  rd: 52,
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  gamesPaused: 0,
  totalRatingChange: 131,
}

describe("RemovePlayerCard", () => {
  beforeEach(() => {
    mutate.mockReset()
    navigate.mockReset()
  })

  it("explains the full deletion determined on the server", () => {
    renderWithLeague(<RemovePlayerCard player={player} removal="deleted" />)

    fireEvent.click(screen.getByRole("button", { name: "Spieler entfernen" }))

    expect(
      screen.getByRole("heading", { name: "Klara Nowak löschen?" })
    ).toBeTruthy()
    expect(screen.getByText(/keine Runden- oder Pausenreferenz/)).toBeTruthy()
    expect(screen.getByRole("button", { name: "Löschen" })).toBeTruthy()
  })

  it("promises an irreversible anonymization for any historical reference", () => {
    renderWithLeague(<RemovePlayerCard player={player} removal="anonymized" />)

    fireEvent.click(screen.getByRole("button", { name: "Spieler entfernen" }))

    expect(
      screen.getByRole("heading", { name: "Klara Nowak entfernen?" })
    ).toBeTruthy()
    expect(
      screen.getByText(/Namensdaten werden irreversibel entfernt/)
    ).toBeTruthy()
    expect(screen.getByRole("button", { name: "Entfernen" })).toBeTruthy()
  })
})

function renderWithLeague(node: ReactNode) {
  return render(
    <LeagueContextProvider value={fixtureLeagueContext}>
      {node}
    </LeagueContextProvider>
  )
}
