import { describe, expect, it } from "vitest"

import {
  commitHint,
  committedRatingChanges,
  committedRoundSummary,
  isRoundWithoutScoring,
  pausingSummary,
  roundProgressLabel,
  sortGamesByCourt,
} from "./round-view"
import type { Game, PausingPlayer, RatingChange, Round } from "./types"

function player(id: string, displayName: string) {
  return { id, displayName, rating: 1500 }
}

function game(id: string, court: number, status: Game["status"]): Game {
  return {
    id,
    court,
    status,
    teamA: { players: [player("a1", "A1"), player("a2", "A2")] },
    teamB: { players: [player("b1", "B1"), player("b2", "B2")] },
  }
}

function round(games: Array<Game>, pausing: Array<PausingPlayer> = []): Round {
  return {
    id: "r1",
    number: 3,
    startedAt: "2026-07-27T19:38:00",
    status: "active",
    pausing,
    games,
  }
}

/** A scored game whose changes are passed as name/delta pairs. */
function scoredGame(
  id: string,
  court: number,
  deltas: Array<[string, number]>
): Game {
  const ratingChanges: Array<RatingChange> = deltas.map(([name, delta]) => ({
    player: player(name, name),
    ratingBefore: 1500,
    ratingAfter: 1500 + delta,
    delta,
  }))

  return {
    ...game(id, court, "finished"),
    result: { pointsA: 21, pointsB: 17, ratingChanges },
  }
}

describe("sortGamesByCourt", () => {
  it("orders by court number", () => {
    const sorted = sortGamesByCourt([
      game("g3", 3, "open"),
      game("g1", 1, "open"),
      game("g2", 2, "open"),
    ])

    expect(sorted.map((entry) => entry.court)).toEqual([1, 2, 3])
  })

  it("does not let status change the order", () => {
    // The point: an entered or cancelled game stays where it was — otherwise the cards
    // slip away under the finger while entering results.
    const sorted = sortGamesByCourt([
      game("g1", 1, "finished"),
      game("g2", 2, "cancelled"),
      game("g3", 3, "open"),
    ])

    expect(sorted.map((entry) => entry.id)).toEqual(["g1", "g2", "g3"])
  })

  it("leaves the passed list untouched", () => {
    const games = [game("g1", 2, "finished"), game("g2", 1, "open")]
    sortGamesByCourt(games)

    expect(games.map((entry) => entry.id)).toEqual(["g1", "g2"])
  })
})

describe("roundProgressLabel", () => {
  it("counts entered games", () => {
    expect(
      roundProgressLabel(
        round([game("g1", 1, "finished"), game("g2", 2, "open")])
      )
    ).toBe("1 von 2 Spielen eingetragen")
  })

  it("counts cancelled games as done, not as entered", () => {
    expect(
      roundProgressLabel(
        round([game("g1", 1, "cancelled"), game("g2", 2, "open")])
      )
    ).toBe("1 von 2 Spielen erledigt")
  })

  it("phrases the single case in the singular", () => {
    expect(roundProgressLabel(round([game("g1", 1, "open")]))).toBe(
      "0 von 1 Spiel eingetragen"
    )
  })
})

describe("pausingSummary", () => {
  function pausing(
    ...entries: Array<[string, PausingPlayer["reason"]]>
  ): Array<PausingPlayer> {
    return entries.map(([name, reason]) => ({
      player: player(name, name),
      reason,
    }))
  }

  it("merges two identical reasons", () => {
    expect(
      pausingSummary(pausing(["Ida K.", "voluntary"], ["Nora T.", "voluntary"]))
    ).toBe("Ida K., Nora T. — beide freiwillig")
  })

  it('says "all" from three players sitting out onward', () => {
    expect(
      pausingSummary(
        pausing(
          ["Ida K.", "assigned"],
          ["Nora T.", "assigned"],
          ["Ben K.", "assigned"]
        )
      )
    ).toBe("Ida K., Nora T., Ben K. — alle eingeteilt")
  })

  it("adds no qualifier for a single person", () => {
    expect(pausingSummary(pausing(["Ida K.", "voluntary"]))).toBe(
      "Ida K. — freiwillig"
    )
  })

  it("appends the reason to each name when the reasons differ", () => {
    expect(
      pausingSummary(pausing(["Ida K.", "voluntary"], ["Nora T.", "assigned"]))
    ).toBe("Ida K. (freiwillig), Nora T. (eingeteilt)")
  })

  it("stays silent on an empty list", () => {
    expect(pausingSummary([])).toBe("")
  })
})

describe("isRoundWithoutScoring", () => {
  it("recognizes a round in which everything was cancelled", () => {
    expect(
      isRoundWithoutScoring(
        round([game("g1", 1, "cancelled"), game("g2", 2, "cancelled")])
      )
    ).toBe(true)
  })

  it("says no as soon as one result exists", () => {
    expect(
      isRoundWithoutScoring(
        round([game("g1", 1, "cancelled"), game("g2", 2, "finished")])
      )
    ).toBe(false)
  })
})

describe("commitHint", () => {
  it("names the reason while the commit is blocked", () => {
    expect(
      commitHint(round([game("g1", 1, "finished"), game("g2", 2, "open")]))
    ).toContain("das letzte Spiel")
  })

  it("points out when there is nothing to score", () => {
    expect(commitHint(round([game("g1", 1, "cancelled")]))).toContain(
      "wertet nichts"
    )
  })

  it("otherwise announces the binding scoring", () => {
    expect(commitHint(round([game("g1", 1, "finished")]))).toContain(
      "verbindlich"
    )
  })
})

describe("committedRatingChanges", () => {
  it("collects the changes from all scored games", () => {
    const changes = committedRatingChanges(
      round([
        scoredGame("g1", 1, [
          ["Klara N.", 6],
          ["Ben K.", -6],
        ]),
        scoredGame("g2", 2, [
          ["Ida K.", 4],
          ["Nora T.", -4],
        ]),
      ])
    )

    expect(changes).toHaveLength(4)
  })

  it("sorts by magnitude, largest movement first", () => {
    const changes = committedRatingChanges(
      round([
        scoredGame("g1", 1, [
          ["Klara N.", 6],
          ["Ben K.", -19],
          ["Ida K.", 12],
        ]),
      ])
    )

    expect(changes.map((change) => change.delta)).toEqual([-19, 12, 6])
  })

  it("orders equally large movements by name", () => {
    const changes = committedRatingChanges(
      round([
        scoredGame("g1", 1, [
          ["Nora T.", 7],
          ["Ben K.", -7],
        ]),
      ])
    )

    expect(changes.map((change) => change.player.displayName)).toEqual([
      "Ben K.",
      "Nora T.",
    ])
  })

  it("leaves cancelled games out", () => {
    const cancelled: Game = {
      ...scoredGame("g2", 2, [["Ida K.", 30]]),
      status: "cancelled",
    }
    const changes = committedRatingChanges(
      round([scoredGame("g1", 1, [["Klara N.", 6]]), cancelled])
    )

    expect(changes.map((change) => change.player.displayName)).toEqual([
      "Klara N.",
    ])
  })
})

describe("committedRoundSummary", () => {
  function pausing(count: number): Array<PausingPlayer> {
    return Array.from({ length: count }, (_, index) => ({
      player: player(`p${index}`, `P${index}`),
      reason: "voluntary" as const,
    }))
  }

  it("names games, participating players and pauses", () => {
    expect(
      committedRoundSummary(
        round(
          [
            game("g1", 1, "finished"),
            game("g2", 2, "finished"),
            game("g3", 3, "finished"),
          ],
          pausing(2)
        )
      )
    ).toBe("3 Spiele · 12 Spieler · 2 Pausen")
  })

  it("phrases the single case in the singular", () => {
    expect(
      committedRoundSummary(round([game("g1", 1, "finished")], pausing(1)))
    ).toBe("1 Spiel · 4 Spieler · 1 Pause")
  })

  it("mentions cancelled games only when there were any", () => {
    expect(
      committedRoundSummary(round([game("g1", 1, "finished")]))
    ).not.toContain("abgesagt")

    expect(
      committedRoundSummary(
        round([game("g1", 1, "finished"), game("g2", 2, "cancelled")])
      )
    ).toContain("1 abgesagt")
  })
})
