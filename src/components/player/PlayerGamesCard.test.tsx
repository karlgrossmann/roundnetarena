import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PlayerGamesCard } from "./PlayerGamesCard"
import type { PlayerGame, PlayerRef } from "@/lib/types"

const now = new Date("2026-07-27T20:00:00")

function ref(id: string): PlayerRef {
  return { id, displayName: `${id} X.`, rating: 1500 }
}

/** Games in descending order, the way `filterPlayerGames()` returns them. */
function games(count: number): Array<PlayerGame> {
  return Array.from({ length: count }, (_value, index) => ({
    gameId: `game_${index}`,
    timestamp: `2026-07-2${index % 8}T19:38:00`,
    partner: ref("partner"),
    opponents: [ref("gegner_a"), ref("gegner_b")] as [PlayerRef, PlayerRef],
    ownPoints: 21,
    opponentPoints: 17,
    won: index % 2 === 0,
    ratingBefore: 1600,
    ratingAfter: 1611,
  }))
}

function rows(): Array<HTMLElement> {
  return screen.getAllByRole("listitem")
}

describe("PlayerGamesCard", () => {
  it("shows at most ten games initially", () => {
    render(<PlayerGamesCard games={games(14)} range="all" now={now} />)

    expect(rows()).toHaveLength(10)
  })

  it("loads further games on button press", () => {
    render(<PlayerGamesCard games={games(14)} range="all" now={now} />)

    fireEvent.click(screen.getByRole("button", { name: "Ältere Spiele laden" }))

    expect(rows()).toHaveLength(14)
    expect(
      screen.queryByRole("button", { name: "Ältere Spiele laden" })
    ).toBeNull()
  })

  it("offers no load-more without further games", () => {
    render(<PlayerGamesCard games={games(3)} range="all" now={now} />)

    expect(
      screen.queryByRole("button", { name: "Ältere Spiele laden" })
    ).toBeNull()
  })

  it("explains an empty list instead of leaving it blank", () => {
    render(<PlayerGamesCard games={[]} range="four-weeks" now={now} />)

    expect(screen.queryByText("Noch keine Spiele gespielt.")).not.toBeNull()
    expect(screen.queryByText("letzte 4 Wochen")).not.toBeNull()
  })

  it("names partner and opponents in plain words", () => {
    render(<PlayerGamesCard games={games(1)} range="all" now={now} />)

    // The partner sits in its own element, so the whole row's text content is checked
    // rather than a single text node.
    const [row] = rows()
    expect(row.textContent).toContain(
      "mit partner X. gegen gegner_a X. & gegner_b X."
    )
  })
})
