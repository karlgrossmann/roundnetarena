import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { RatingChangeList } from "./RatingChangeList"
import type { RatingChange } from "@/lib/types"

function changes(count: number): Array<RatingChange> {
  return Array.from({ length: count }, (_, index) => ({
    player: {
      id: `p${index}`,
      displayName: `Spieler ${index}`,
      rating: 1500,
    },
    ratingBefore: 1500,
    ratingAfter: 1500 + (count - index),
    delta: count - index,
  }))
}

describe("RatingChangeList", () => {
  it("shows short lists in full and without a toggle", () => {
    render(<RatingChangeList changes={changes(4)} />)

    expect(screen.getAllByRole("listitem")).toHaveLength(4)
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("shows five rows and offers the rest behind a toggle", () => {
    render(<RatingChangeList changes={changes(12)} />)

    expect(screen.getAllByRole("listitem")).toHaveLength(5)
    expect(
      screen.queryByRole("button", { name: /Alle 12 Änderungen zeigen/ })
    ).not.toBeNull()
  })

  it("expands and collapses the remaining changes", () => {
    render(<RatingChangeList changes={changes(12)} />)

    fireEvent.click(
      screen.getByRole("button", { name: /Alle 12 Änderungen zeigen/ })
    )
    expect(screen.getAllByRole("listitem")).toHaveLength(12)

    fireEvent.click(screen.getByRole("button", { name: /Weniger zeigen/ }))
    expect(
      screen.queryByRole("button", { name: /Alle 12 Änderungen zeigen/ })
    ).not.toBeNull()
  })

  it("spells out the rating movement", () => {
    render(
      <RatingChangeList
        changes={[
          {
            player: { id: "p1", displayName: "Lukas A.", rating: 1421 },
            ratingBefore: 1402,
            ratingAfter: 1421,
            delta: 19,
          },
        ]}
      />
    )

    expect(screen.queryByText("1402 → 1421")).not.toBeNull()
    expect(screen.queryByText("+19")).not.toBeNull()
  })
})
