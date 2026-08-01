import { useState } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { PlayerTile } from "./PlayerTile"
import type { PlayerRef, PoolStatus } from "@/lib/types"

const player: PlayerRef = {
  id: "p1",
  displayName: "Klara N.",
  rating: 1631,
}

/** Tile with its own state — mirrors how it hangs in the pool card. */
function StatefulTile({ initial }: { initial: PoolStatus }) {
  const [status, setStatus] = useState<PoolStatus>(initial)
  return <PlayerTile player={player} status={status} onToggle={setStatus} />
}

function tile(): HTMLElement {
  return screen.getByRole("button")
}

/** The label as a screen reader would announce it. */
function accessibleName(): string {
  return tile().textContent
}

describe("PlayerTile", () => {
  it("cycles through all three states on repeated taps", () => {
    render(<StatefulTile initial="absent" />)
    expect(accessibleName()).toContain("nicht da")

    fireEvent.click(tile())
    expect(accessibleName()).toContain("spielt mit")

    fireEvent.click(tile())
    expect(accessibleName()).toContain("pausiert")

    fireEvent.click(tile())
    expect(accessibleName()).toContain("nicht da")
  })

  it("reports only present players as pressed", () => {
    render(<StatefulTile initial="absent" />)
    expect(tile().getAttribute("aria-pressed")).toBe("false")

    fireEvent.click(tile())
    expect(tile().getAttribute("aria-pressed")).toBe("true")

    // Someone paused is still present — the value stays "true".
    fireEvent.click(tile())
    expect(tile().getAttribute("aria-pressed")).toBe("true")
  })

  it("reports the next state outwards instead of storing it itself", () => {
    const onToggle = vi.fn()
    render(<PlayerTile player={player} status="playing" onToggle={onToggle} />)

    fireEvent.click(tile())

    expect(onToggle).toHaveBeenCalledWith("paused")
  })

  it("shows the rating, and the state instead when paused", () => {
    const { rerender } = render(
      <PlayerTile player={player} status="playing" onToggle={vi.fn()} />
    )
    expect(screen.queryByText("1631")).not.toBeNull()

    rerender(<PlayerTile player={player} status="paused" onToggle={vi.fn()} />)
    expect(screen.queryByText("1631")).toBeNull()
    expect(screen.queryByText("pausiert")).not.toBeNull()
  })

  it("does not react while disabled", () => {
    const onToggle = vi.fn()
    render(
      <PlayerTile
        player={player}
        status="absent"
        onToggle={onToggle}
        disabled
      />
    )

    fireEvent.click(tile())

    expect(onToggle).not.toHaveBeenCalled()
  })
})
