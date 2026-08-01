import { describe, expect, it } from "vitest"

import {
  canCommitRound,
  canStartRound,
  commitBlockedReason,
  isPoolStale,
  nextPoolStatus,
  playersAtRest,
  roundProgress,
  suggestedCourts,
} from "./round"
import type { Game, Pool, PoolStatus, Round } from "./types"

function pool(statuses: Array<PoolStatus>): Pool {
  return {
    updatedAt: "2026-07-27T19:00:00",
    fixedTeams: [],
    entries: statuses.map((status, index) => ({
      status,
      player: {
        id: `p${index}`,
        displayName: `Spieler ${index}`,
        rating: 1500,
      },
    })),
  }
}

function round(statuses: Array<Game["status"]>): Round {
  return {
    id: "r1",
    number: 3,
    startedAt: "2026-07-27T19:38:00",
    status: "active",
    pausing: [],
    games: statuses.map((status, index) => ({
      id: `g${index}`,
      court: index + 1,
      status,
      teamA: {
        players: [
          { id: "a1", displayName: "A1", rating: 1500 },
          { id: "a2", displayName: "A2", rating: 1500 },
        ],
      },
      teamB: {
        players: [
          { id: "b1", displayName: "B1", rating: 1500 },
          { id: "b2", displayName: "B2", rating: 1500 },
        ],
      },
    })),
  }
}

describe("suggestedCourts", () => {
  it("fills complete courts only", () => {
    expect(suggestedCourts(12)).toBe(3)
    expect(suggestedCourts(13)).toBe(3)
    expect(suggestedCourts(3)).toBe(0)
  })
})

describe("playersAtRest", () => {
  it("has nobody sit out when the numbers work out", () => {
    expect(playersAtRest(12, 3)).toBe(0)
  })

  it("sits out the surplus players", () => {
    expect(playersAtRest(12, 2)).toBe(4)
  })

  it("also sits out the remainder of a count not divisible by four", () => {
    // 13 players on 3 courts: 12 play, one is necessarily left over.
    expect(playersAtRest(13, 3)).toBe(1)
  })

  it("never returns a negative value", () => {
    expect(playersAtRest(8, 4)).toBe(0)
  })
})

describe("canStartRound", () => {
  it("requires four participating players", () => {
    expect(canStartRound(pool(["playing", "playing", "playing"]))).toBe(false)
    expect(
      canStartRound(pool(["playing", "playing", "playing", "playing"]))
    ).toBe(true)
  })

  it("does not count paused players", () => {
    expect(
      canStartRound(pool(["playing", "playing", "playing", "paused"]))
    ).toBe(false)
  })
})

describe("canCommitRound", () => {
  it("refuses to commit while games are open", () => {
    expect(canCommitRound(round(["finished", "open"]))).toBe(false)
  })

  it("allows the commit once everything is entered or cancelled", () => {
    expect(canCommitRound(round(["finished", "cancelled"]))).toBe(true)
  })

  it("excludes rounds that are already committed", () => {
    const committed: Round = { ...round(["finished"]), status: "committed" }
    expect(canCommitRound(committed)).toBe(false)
  })
})

describe("commitBlockedReason", () => {
  it("gives no reason when the commit is possible", () => {
    expect(commitBlockedReason(round(["finished"]))).toBeNull()
  })

  it("phrases the single case in the singular", () => {
    expect(commitBlockedReason(round(["finished", "open"]))).toEqual({
      code: "round.open_games",
      values: { count: 1 },
    })
  })

  it("names the number of open games", () => {
    expect(commitBlockedReason(round(["open", "open", "finished"]))).toEqual({
      code: "round.open_games",
      values: { count: 2 },
    })
  })
})

describe("roundProgress", () => {
  it("counts cancelled games as done", () => {
    expect(roundProgress(round(["finished", "cancelled", "open"]))).toBeCloseTo(
      2 / 3
    )
  })

  it("tolerates a round without games", () => {
    expect(roundProgress(round([]))).toBe(0)
  })
})

describe("isPoolStale", () => {
  it("treats a fresh pool as usable", () => {
    expect(isPoolStale(pool([]), new Date("2026-07-27T20:30:00"))).toBe(false)
  })

  it("reports yesterday's pool as stale", () => {
    expect(isPoolStale(pool([]), new Date("2026-07-28T19:00:00"))).toBe(true)
  })
})

describe("nextPoolStatus", () => {
  it("cycles: absent → playing → paused → absent", () => {
    expect(nextPoolStatus("absent")).toBe("playing")
    expect(nextPoolStatus("playing")).toBe("paused")
    expect(nextPoolStatus("paused")).toBe("absent")
  })
})
