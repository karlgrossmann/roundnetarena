import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { GameCard } from "./GameCard"
import type { Game } from "@/lib/types"

function player(id: string, displayName: string) {
  return { id, displayName, rating: 1500 }
}

function game(status: Game["status"], withResult = false): Game {
  return {
    id: "g1",
    court: 2,
    status,
    teamA: { players: [player("a1", "Jonas P."), player("a2", "David R.")] },
    teamB: { players: [player("b1", "Emma L."), player("b2", "Greta S.")] },
    result: withResult
      ? {
          pointsA: 21,
          pointsB: 17,
          ratingChanges: [
            {
              player: player("a1", "Jonas P."),
              ratingBefore: 1500,
              ratingAfter: 1512,
              delta: 12,
            },
          ],
        }
      : undefined,
  }
}

const handlers = {
  onEnterResult: vi.fn(),
  onCorrectResult: vi.fn(),
  onCancel: vi.fn(),
  onUncancel: vi.fn(),
}

function renderCard(current: Game) {
  return render(<GameCard game={current} preview {...handlers} />)
}

describe("GameCard", () => {
  it("offers entering and cancelling on an open game", () => {
    const onEnterResult = vi.fn()
    const onCancel = vi.fn()
    render(
      <GameCard
        game={game("open")}
        preview
        {...handlers}
        onEnterResult={onEnterResult}
        onCancel={onCancel}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Ergebnis eintragen" }))
    fireEvent.click(screen.getByRole("button", { name: "Absagen" }))

    expect(onEnterResult).toHaveBeenCalledWith("g1")
    expect(onCancel).toHaveBeenCalledWith("g1")
  })

  it("shows VS instead of a score on an open game", () => {
    renderCard(game("open"))

    expect(screen.queryByText("VS")).not.toBeNull()
  })

  it("shows the score on a finished game and leads to a correction", () => {
    const onCorrectResult = vi.fn()
    render(
      <GameCard
        game={game("finished", true)}
        preview
        {...handlers}
        onCorrectResult={onCorrectResult}
      />
    )

    expect(screen.queryByText("21")).not.toBeNull()
    expect(screen.queryByText("17")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Korrigieren" }))
    expect(onCorrectResult).toHaveBeenCalledWith("g1")
  })

  it("marks rating changes as a preview before the round is committed", () => {
    const { rerender } = renderCard(game("finished", true))
    expect(screen.queryByText("Vorschau")).not.toBeNull()

    rerender(
      <GameCard game={game("finished", true)} preview={false} {...handlers} />
    )
    expect(screen.queryByText("Vorschau")).toBeNull()
  })

  it("lets a cancellation be undone", () => {
    const onUncancel = vi.fn()
    render(
      <GameCard
        game={game("cancelled")}
        preview
        {...handlers}
        onUncancel={onUncancel}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Absage zurücknehmen" }))
    expect(onUncancel).toHaveBeenCalledWith("g1")
  })

  it("renders no write actions in read-only mode", () => {
    render(<GameCard game={game("open")} preview readOnly />)

    expect(screen.queryByRole("button")).toBeNull()
    expect(screen.queryByText("VS")).not.toBeNull()
  })
})
