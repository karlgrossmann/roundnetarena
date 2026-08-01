import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { selectOption } from "@/test-select"
import type { PoolEntry, PoolStatus } from "@/lib/types"

import { FixedTeamsCard } from "./FixedTeamsCard"

function entries(secondStatus: PoolStatus): Array<PoolEntry> {
  return [
    {
      player: { id: "p1", displayName: "Ada A.", rating: 1500 },
      status: "playing",
    },
    {
      player: { id: "p2", displayName: "Berta B.", rating: 1450 },
      status: secondStatus,
    },
  ]
}

function renderCard(secondStatus: PoolStatus) {
  return render(
    <FixedTeamsCard
      entries={entries(secondStatus)}
      teams={[{ id: "team", players: ["p1", "p2"] }]}
      onCreate={vi.fn()}
      onRemove={vi.fn()}
    />
  )
}

describe("FixedTeamsCard", () => {
  it.each(["paused", "absent"] as const)(
    "still shows a team inactive due to %s as saved",
    (status) => {
      renderCard(status)

      expect(screen.getByText("Ada A. & Berta B.")).toBeTruthy()
      expect(screen.getByText("gespeichert · inaktiv")).toBeTruthy()
    }
  )

  it("marks the fixed team as active once both players are back in play", () => {
    renderCard("playing")

    expect(screen.getByText("aktiv")).toBeTruthy()
    expect(screen.queryByText("gespeichert · inaktiv")).toBeNull()
  })

  it("shows the selected player's name in the closed trigger, not their id", async () => {
    renderCard("playing")

    const trigger = screen.getByLabelText("Erste Person")
    await selectOption(trigger, "Berta B.")

    await waitFor(() => expect(trigger.textContent).toContain("Berta B."))
    expect(trigger.textContent).not.toContain("p2")
  })
})
