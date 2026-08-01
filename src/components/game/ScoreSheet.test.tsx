import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ScoreSheet } from "./ScoreSheet"
import type { Game } from "@/lib/types"

function player(id: string, displayName: string) {
  return { id, displayName, rating: 1500 }
}

function game(result?: { pointsA: number; pointsB: number }): Game {
  return {
    id: "g1",
    court: 2,
    status: result ? "finished" : "open",
    teamA: { players: [player("a1", "Jonas P."), player("a2", "David R.")] },
    teamB: { players: [player("b1", "Emma L."), player("b2", "Greta S.")] },
    result: result ? { ...result, ratingChanges: [] } : undefined,
  }
}

function renderSheet(current: Game, onSubmit = vi.fn()) {
  render(
    <ScoreSheet
      game={current}
      open
      onOpenChange={vi.fn()}
      onSubmit={onSubmit}
    />
  )
  return onSubmit
}

function field(team: string): HTMLElement {
  return screen.getByLabelText(`Punkte ${team}`)
}

function save(): void {
  fireEvent.click(screen.getByRole("button", { name: /speichern/i }))
}

describe("ScoreSheet", () => {
  it("saves a regular result without asking back", () => {
    const onSubmit = renderSheet(game())

    fireEvent.change(field("Jonas P. und David R."), {
      target: { value: "21" },
    })
    fireEvent.change(field("Emma L. und Greta S."), { target: { value: "17" } })
    save()

    expect(onSubmit).toHaveBeenCalledWith(21, 17)
  })

  it("does not save a draw", () => {
    const onSubmit = renderSheet(game())

    fireEvent.change(field("Jonas P. und David R."), {
      target: { value: "21" },
    })
    fireEvent.change(field("Emma L. und Greta S."), { target: { value: "21" } })
    save()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.queryByText(/unentschieden/i)).not.toBeNull()
  })

  it("saves an unusual result only after an explicit confirmation", () => {
    const onSubmit = renderSheet(game())

    fireEvent.change(field("Jonas P. und David R."), {
      target: { value: "12" },
    })
    fireEvent.change(field("Emma L. und Greta S."), { target: { value: "9" } })

    save()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.queryByText(/15 Punkte/)).not.toBeNull()

    // Same button, different label now — the warning does not block.
    fireEvent.click(screen.getByRole("button", { name: "Trotzdem speichern" }))
    expect(onSubmit).toHaveBeenCalledWith(12, 9)
  })

  it("requires a fresh confirmation after a change", () => {
    const onSubmit = renderSheet(game())

    fireEvent.change(field("Jonas P. und David R."), {
      target: { value: "12" },
    })
    fireEvent.change(field("Emma L. und Greta S."), { target: { value: "9" } })
    save()

    fireEvent.change(field("Emma L. und Greta S."), { target: { value: "8" } })
    save()

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("requires points for both teams", () => {
    const onSubmit = renderSheet(game())

    fireEvent.change(field("Jonas P. und David R."), {
      target: { value: "21" },
    })
    save()

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.queryByText(/beide Teams/)).not.toBeNull()
  })

  it("opens with the previous values when correcting", () => {
    renderSheet(game({ pointsA: 21, pointsB: 17 }))

    expect(field("Jonas P. und David R.")).toHaveProperty("value", "21")
    expect(field("Emma L. und Greta S.")).toHaveProperty("value", "17")
  })

  it("jumps to the second field after two typed digits", () => {
    renderSheet(game())

    fireEvent.change(field("Jonas P. und David R."), {
      target: { value: "2" },
    })
    expect(document.activeElement).not.toBe(field("Emma L. und Greta S."))

    fireEvent.change(field("Jonas P. und David R."), {
      target: { value: "21" },
    })
    expect(document.activeElement).toBe(field("Emma L. und Greta S."))
  })

  it("does not jump on when the buttons step up to two digits", () => {
    renderSheet(game({ pointsA: 9, pointsB: 21 }))

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ein Punkt mehr für Jonas P. und David R.",
      })
    )

    expect(field("Jonas P. und David R.")).toHaveProperty("value", "10")
    expect(document.activeElement).not.toBe(field("Emma L. und Greta S."))
  })

  it("keeps the stepper buttons out of the tab order", () => {
    renderSheet(game())

    const steppers = screen.getAllByRole("button", { name: /Ein Punkt/ })
    expect(steppers).toHaveLength(4)
    for (const stepper of steppers) {
      expect(stepper).toHaveProperty("tabIndex", -1)
    }

    // What remains is the path through the form: two fields, cancel, save.
    for (const element of [
      field("Jonas P. und David R."),
      field("Emma L. und Greta S."),
      screen.getByRole("button", { name: "Abbrechen" }),
      screen.getByRole("button", { name: "Speichern" }),
    ]) {
      expect(element).not.toHaveProperty("tabIndex", -1)
    }
  })

  it("steps in the field via arrow up and down", () => {
    renderSheet(game())
    const input = field("Jonas P. und David R.")

    fireEvent.keyDown(input, { key: "ArrowUp" })
    fireEvent.keyDown(input, { key: "ArrowUp" })
    expect(input).toHaveProperty("value", "2")

    fireEvent.keyDown(input, { key: "ArrowDown" })
    fireEvent.keyDown(input, { key: "ArrowDown" })
    fireEvent.keyDown(input, { key: "ArrowDown" })
    expect(input).toHaveProperty("value", "0")
  })

  it("steps by one via the buttons and not below zero", () => {
    renderSheet(game())

    const plus = screen.getByRole("button", {
      name: "Ein Punkt mehr für Jonas P. und David R.",
    })
    const minus = screen.getByRole("button", {
      name: "Ein Punkt weniger für Jonas P. und David R.",
    })

    fireEvent.click(plus)
    fireEvent.click(plus)
    expect(field("Jonas P. und David R.")).toHaveProperty("value", "2")

    fireEvent.click(minus)
    fireEvent.click(minus)
    fireEvent.click(minus)
    expect(field("Jonas P. und David R.")).toHaveProperty("value", "0")
  })
})
