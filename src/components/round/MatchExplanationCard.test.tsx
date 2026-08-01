import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { MatchExplanationCard } from "./MatchExplanationCard"
import type { MatchExplanation, PlayerRef } from "@/lib/types"
import { overwriteGetLocale } from "@/paraglide/runtime.js"

const players: Array<PlayerRef> = Array.from({ length: 8 }, (_, index) => ({
  id: `p${index + 1}`,
  displayName: `Spieler ${index + 1}`,
  rating: 1500,
}))

const explanation: MatchExplanation = {
  version: 1,
  matcher: "default",
  chosen: {
    id: "chosen",
    matchups: [
      { teamA: ["p1", "p2"], teamB: ["p3", "p4"] },
      { teamA: ["p5", "p6"], teamB: ["p7", "p8"] },
    ],
    cost: 1000,
  },
  alternatives: [
    {
      id: "teamDifference",
      matchups: [
        { teamA: ["p1", "p3"], teamB: ["p5", "p4"] },
        { teamA: ["p2", "p6"], teamB: ["p7", "p8"] },
      ],
      cost: 1123.45,
      costDelta: 123.45,
    },
  ],
}

describe("MatchExplanationCard", () => {
  beforeEach(() => {
    overwriteGetLocale(() => "de")
  })

  it("resolves structured criteria and player ids only in the UI", () => {
    render(<MatchExplanationCard explanation={explanation} players={players} />)

    fireEvent.click(
      screen.getByRole("button", { name: "Warum diese Paarungen?" })
    )

    expect(screen.queryByText("Ausgeglichenere Teamstärken")).not.toBeNull()
    expect(
      screen.queryByText(
        "Feld 1: Spieler 1 + Spieler 3 gegen Spieler 5 + Spieler 4"
      )
    ).not.toBeNull()
    expect(screen.queryByText("+123,45")).not.toBeNull()
  })

  it("explains an empty counterfactual set without inventing an alternative", () => {
    render(
      <MatchExplanationCard
        explanation={{ ...explanation, alternatives: [] }}
        players={players}
      />
    )

    fireEvent.click(
      screen.getByRole("button", { name: "Warum diese Paarungen?" })
    )

    expect(
      screen.queryByText(
        "Für diese Runde wurde keine sinnvolle Ein-Tausch-Alternative gefunden."
      )
    ).not.toBeNull()
  })
})
