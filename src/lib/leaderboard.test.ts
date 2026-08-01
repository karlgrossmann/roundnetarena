import { describe, expect, it } from "vitest"

import {
  ALL_TABLE_COLUMNS,
  assignRanks,
  columnLabel,
  columnValue,
  filterPlayers,
  filterPlayersByPool,
  winRate,
} from "./leaderboard"
import type { Player, Pool, TableColumn } from "./types"

function player(overrides: Partial<Player> = {}): Player {
  return {
    id: "player_x",
    firstName: "Klara",
    lastName: "Nowak",
    displayName: "Klara N.",
    rating: 1500,
    rd: 60,
    gamesPlayed: 10,
    gamesWon: 6,
    gamesLost: 4,
    gamesPaused: 2,
    totalRatingChange: 40,
    ...overrides,
  }
}

describe("columnLabel", () => {
  it("labels every column that can be shown", () => {
    for (const column of ALL_TABLE_COLUMNS) {
      expect(columnLabel(column)).not.toBe("")
    }
  })

  it("covers the full extent of TableColumn", () => {
    const expected: Array<TableColumn> = [
      "rating",
      "rd",
      "gamesPlayed",
      "gamesWon",
      "gamesLost",
      "winPercentage",
      "totalRatingChange",
    ]
    expect([...ALL_TABLE_COLUMNS].sort()).toEqual(expected.sort())
  })
})

describe("winRate", () => {
  it("reflects the share of games won", () => {
    expect(winRate(player({ gamesPlayed: 10, gamesWon: 6 }))).toBeCloseTo(0.6)
  })

  it("returns 0 without games played instead of dividing by zero", () => {
    expect(winRate(player({ gamesPlayed: 0, gamesWon: 0 }))).toBe(0)
  })
})

describe("columnValue", () => {
  it("reads plain columns straight off the player", () => {
    const p = player({ rating: 1662, rd: 48, totalRatingChange: -12 })
    expect(columnValue(p, "rating")).toBe(1662)
    expect(columnValue(p, "rd")).toBe(48)
    expect(columnValue(p, "totalRatingChange")).toBe(-12)
  })

  it("derives the win rate, since it is not a field on the player", () => {
    const p = player({ gamesPlayed: 4, gamesWon: 1 })
    expect(columnValue(p, "winPercentage")).toBeCloseTo(0.25)
  })
})

describe("filterPlayers", () => {
  const players = [
    player({ id: "a", displayName: "Hannes W." }),
    player({ id: "b", displayName: "Klara N." }),
    player({ id: "c", displayName: "Mia H." }),
  ]

  it("returns all players without a search term", () => {
    expect(filterPlayers(players, "")).toHaveLength(3)
    expect(filterPlayers(players, "   ")).toHaveLength(3)
  })

  it("ignores letter case", () => {
    expect(filterPlayers(players, "klara").map((p) => p.id)).toEqual(["b"])
    expect(filterPlayers(players, "KLARA").map((p) => p.id)).toEqual(["b"])
  })

  it("also finds matches in the middle of a name", () => {
    expect(filterPlayers(players, "anne").map((p) => p.id)).toEqual(["a"])
  })

  it("returns an empty list when nothing matches", () => {
    expect(filterPlayers(players, "Zoe")).toEqual([])
  })
})

describe("filterPlayersByPool", () => {
  const players = [
    player({ id: "playing" }),
    player({ id: "paused" }),
    player({ id: "absent" }),
    player({ id: "not-listed" }),
  ]
  const pool: Pool = {
    updatedAt: "2026-07-27T18:00:00Z",
    entries: [
      {
        player: { id: "playing", displayName: "Spielt", rating: 1500 },
        status: "playing",
      },
      {
        player: { id: "paused", displayName: "Pausiert", rating: 1500 },
        status: "paused",
      },
      {
        player: { id: "absent", displayName: "Abwesend", rating: 1500 },
        status: "absent",
      },
    ],
    fixedTeams: [],
  }

  it("leaves the full table untouched without a pool restriction", () => {
    expect(filterPlayersByPool(players, pool, false)).toBe(players)
  })

  it("includes playing and paused players, but not absent ones", () => {
    expect(
      filterPlayersByPool(players, pool, true).map((entry) => entry.id)
    ).toEqual(["playing", "paused"])
  })

  it("does not modify players or pool", () => {
    filterPlayersByPool(players, pool, true)
    expect(players).toHaveLength(4)
    expect(pool.entries).toHaveLength(3)
  })
})

describe("assignRanks", () => {
  it("numbers a list without ties consecutively", () => {
    expect(assignRanks([1662, 1631, 1588])).toEqual([1, 2, 3])
  })

  it("leaves the rank empty when the rating repeats the previous one", () => {
    expect(assignRanks([1662, 1631, 1631, 1588])).toEqual([1, 2, null, 4])
  })

  it("numbers by position, not by the count of predecessors", () => {
    // After a tie, numbering continues with the row number — the same counting the
    // backend uses when it emits the table row by row.
    expect(assignRanks([1500, 1500, 1500, 1400])).toEqual([1, null, null, 4])
  })

  it("always gives the first entry rank 1", () => {
    expect(assignRanks([1400, 1400])).toEqual([1, null])
  })

  it("copes with an empty list", () => {
    expect(assignRanks([])).toEqual([])
  })
})
