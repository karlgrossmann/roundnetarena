import { describe, expect, it } from "vitest"

import { PLAYER_NOT_FOUND_MESSAGE } from "./api/queries"
import {
  filterPlayerGames,
  filterRatingPoints,
  gameDelta,
  gameMomentLabel,
  isPlayerNotFound,
  playerRank,
  playerRemovalDescription,
  playerStandingLabel,
  rangeDescription,
} from "./player-view"
import type { Player, PlayerGame, PlayerRef, RatingPoint } from "./types"

function player(overrides: Partial<Player> & Pick<Player, "id">): Player {
  return {
    firstName: "Klara",
    lastName: "Nowak",
    displayName: "Klara N.",
    rating: 1500,
    rd: 52,
    gamesPlayed: 31,
    gamesWon: 18,
    gamesLost: 13,
    gamesPaused: 9,
    totalRatingChange: 131,
    ...overrides,
  }
}

function ref(id: string): PlayerRef {
  return { id, displayName: `${id} X.`, rating: 1500 }
}

function ratingPoint(timestamp: string, rating: number): RatingPoint {
  return { timestamp, rating, rd: 60 }
}

function game(
  timestamp: string,
  overrides: Partial<PlayerGame> = {}
): PlayerGame {
  return {
    gameId: `game_${timestamp}`,
    timestamp,
    partner: ref("partner"),
    opponents: [ref("a"), ref("b")],
    ownPoints: 21,
    opponentPoints: 17,
    won: true,
    ratingBefore: 1600,
    ratingAfter: 1611,
    ...overrides,
  }
}

const now = new Date("2026-07-27T20:00:00")

describe("playerRank", () => {
  const players = [
    player({ id: "a", rating: 1662 }),
    player({ id: "b", rating: 1631 }),
    player({ id: "c", rating: 1588 }),
  ]

  it("ranks by rating, descending", () => {
    expect(playerRank(players, "a")).toBe(1)
    expect(playerRank(players, "c")).toBe(3)
  })

  it("does not depend on the input order", () => {
    const shuffled = [players[2], players[0], players[1]]
    expect(playerRank(shuffled, "a")).toBe(1)
  })

  it("gives both players the same rank on an equal rating", () => {
    const tied = [
      player({ id: "a", rating: 1600 }),
      player({ id: "b", rating: 1600 }),
      player({ id: "c", rating: 1500 }),
    ]

    expect(playerRank(tied, "a")).toBe(1)
    expect(playerRank(tied, "b")).toBe(1)
    expect(playerRank(tied, "c")).toBe(3)
  })

  it("knows no rank for an unrelated player", () => {
    expect(playerRank(players, "unknown")).toBeNull()
  })

  it("sorts without modifying the input", () => {
    playerRank(players, "c")
    expect(players[0].id).toBe("a")
  })
})

describe("playerStandingLabel", () => {
  it("combines rank and RD", () => {
    expect(playerStandingLabel(2, 52)).toBe("Platz 2 · RD 52")
  })

  it("names only the RD when there is no rank", () => {
    expect(playerStandingLabel(null, 125)).toBe("RD 125")
  })

  it("rounds the RD to whole points", () => {
    expect(playerStandingLabel(1, 51.6)).toBe("Platz 1 · RD 52")
  })
})

describe("filterRatingPoints", () => {
  const points = [
    ratingPoint("2026-07-27T19:38:00", 1631),
    ratingPoint("2026-02-03T19:00:00", 1500),
    ratingPoint("2026-07-14T19:00:00", 1638),
  ]

  it("sorts ascending by time", () => {
    expect(filterRatingPoints(points, "all", now).map((p) => p.rating)).toEqual(
      [1500, 1638, 1631]
    )
  })

  it("limits to the selected time range", () => {
    expect(
      filterRatingPoints(points, "four-weeks", now).map((p) => p.rating)
    ).toEqual([1638, 1631])
  })

  it("shows everything when the current time is unknown", () => {
    expect(filterRatingPoints(points, "four-weeks", null)).toHaveLength(3)
  })
})

describe("filterPlayerGames", () => {
  const games = [
    game("2026-07-20T19:41:00"),
    game("2026-07-27T19:38:00"),
    game("2026-03-03T19:00:00"),
  ]

  it("puts the most recent game first", () => {
    expect(
      filterPlayerGames(games, "all", now).map((g) => g.timestamp)
    ).toEqual([
      "2026-07-27T19:38:00",
      "2026-07-20T19:41:00",
      "2026-03-03T19:00:00",
    ])
  })

  it("limits to the selected time range", () => {
    expect(filterPlayerGames(games, "four-weeks", now)).toHaveLength(2)
  })

  it("leaves the input unchanged", () => {
    filterPlayerGames(games, "four-weeks", now)
    expect(games[0].timestamp).toBe("2026-07-20T19:41:00")
  })
})

describe("gameMomentLabel", () => {
  it("names the day and the time", () => {
    expect(gameMomentLabel("2026-07-20T20:12:00", now)).toBe("20. Juli · 20:12")
  })

  it("stays with the time when the current time is unknown", () => {
    expect(gameMomentLabel("2026-07-20T20:12:00", null)).toBe("20:12")
  })
})

describe("gameDelta", () => {
  it("computes from the viewed player's perspective", () => {
    expect(gameDelta(game("2026-07-27T19:38:00"))).toBe(11)
    expect(
      gameDelta(
        game("2026-07-27T19:38:00", { ratingBefore: 1638, ratingAfter: 1631 })
      )
    ).toBe(-7)
  })
})

describe("rangeDescription", () => {
  it("describes every time range in words", () => {
    expect(rangeDescription("four-weeks")).toBe("letzte 4 Wochen")
    expect(rangeDescription("six-months")).toBe("letzte 6 Monate")
    expect(rangeDescription("all")).toBe("alle Spiele")
    expect(
      rangeDescription({
        kind: "custom",
        from: "2026-06-01",
        to: "2026-06-30",
      })
    ).toBe("01.06.2026–30.06.2026")
  })
})

describe("playerRemovalDescription", () => {
  it("explains on anonymization why the history stays", () => {
    const text = playerRemovalDescription(
      player({ id: "a", gamesPlayed: 31 }),
      "anonymized"
    )

    expect(text).toContain("Klara Nowak ist bereits")
    expect(text).toContain("Namensdaten werden irreversibel entfernt")
    expect(text).toContain("Ergebnisse und Ratings")
  })

  it("calls deletion by its name when deleting", () => {
    expect(
      playerRemovalDescription(
        player({
          id: "a",
          firstName: "Nora",
          lastName: "Thiel",
          gamesPlayed: 0,
        }),
        "deleted"
      )
    ).toBe(
      "Nora Thiel besitzt keine Runden- oder Pausenreferenz und wird vollständig gelöscht."
    )
  })
})

describe("isPlayerNotFound", () => {
  it("recognizes the unknown ID by its message", () => {
    expect(isPlayerNotFound(new Error(PLAYER_NOT_FOUND_MESSAGE))).toBe(true)
  })

  it("keeps other errors apart", () => {
    expect(isPlayerNotFound(new Error("network error"))).toBe(false)
    expect(isPlayerNotFound("broken")).toBe(false)
  })
})
