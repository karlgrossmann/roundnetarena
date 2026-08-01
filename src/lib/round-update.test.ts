import { describe, expect, it } from "vitest"

import {
  committedRound,
  roundWithAllCancelled,
  roundWithCancelled,
  roundWithResult,
  summaryForRound,
} from "./round-update"
import type { DashboardSummary, Game, GameResult, Round } from "./types"

function player(id: string) {
  return { id, displayName: id.toUpperCase(), rating: 1500 }
}

function game(id: string, court: number, status: Game["status"]): Game {
  return {
    id,
    court,
    status,
    teamA: { players: [player("a1"), player("a2")] },
    teamB: { players: [player("b1"), player("b2")] },
  }
}

function round(games: Array<Game>): Round {
  return {
    id: "r1",
    number: 3,
    startedAt: "2026-07-27T19:38:00",
    status: "active",
    pausing: [],
    games,
  }
}

const result: GameResult = { pointsA: 21, pointsB: 17, ratingChanges: [] }

describe("roundWithResult", () => {
  it("records the result and sets the game to finished", () => {
    const next = roundWithResult(round([game("g1", 1, "open")]), "g1", result)

    expect(next.games[0].status).toBe("finished")
    expect(next.games[0].result).toEqual(result)
  })

  it("leaves the passed round untouched", () => {
    const before = round([game("g1", 1, "open")])
    const next = roundWithResult(before, "g1", result)

    expect(before.games[0].status).toBe("open")
    expect(before.games[0].result).toBeUndefined()
    expect(next).not.toBe(before)
    expect(next.games).not.toBe(before.games)
  })

  it("replaces the previous result on a correction", () => {
    const finished = roundWithResult(
      round([game("g1", 1, "open")]),
      "g1",
      result
    )
    const corrected = roundWithResult(finished, "g1", {
      ...result,
      pointsB: 19,
    })

    expect(corrected.games[0].result?.pointsB).toBe(19)
  })

  it("does not touch other games", () => {
    const before = round([game("g1", 1, "open"), game("g2", 2, "open")])
    const next = roundWithResult(before, "g1", result)

    expect(next.games[1]).toBe(before.games[1])
  })
})

describe("roundWithCancelled", () => {
  it("cancels an open game", () => {
    const next = roundWithCancelled(round([game("g1", 1, "open")]), "g1", true)
    expect(next.games[0].status).toBe("cancelled")
  })

  it("returns a cancelled game without a result to open", () => {
    const cancelled = roundWithCancelled(
      round([game("g1", 1, "open")]),
      "g1",
      true
    )
    const back = roundWithCancelled(cancelled, "g1", false)

    expect(back.games[0].status).toBe("open")
  })

  it("restores a game with a result to finished", () => {
    const finished = roundWithResult(
      round([game("g1", 1, "open")]),
      "g1",
      result
    )
    const cancelled = roundWithCancelled(finished, "g1", true)

    expect(roundWithCancelled(cancelled, "g1", false).games[0].status).toBe(
      "finished"
    )
  })
})

describe("roundWithAllCancelled", () => {
  it("cancels every game, including the ones already entered", () => {
    const before = roundWithResult(
      round([game("g1", 1, "open"), game("g2", 2, "open")]),
      "g1",
      result
    )
    const next = roundWithAllCancelled(before)

    expect(next.games.map((entry) => entry.status)).toEqual([
      "cancelled",
      "cancelled",
    ])
  })

  it("keeps the entered results", () => {
    const finished = roundWithResult(
      round([game("g1", 1, "open")]),
      "g1",
      result
    )
    const cancelled = roundWithAllCancelled(finished)

    // Undoing the cancellation individually brings back the unchanged score.
    expect(cancelled.games[0].result).toEqual(result)
    expect(roundWithCancelled(cancelled, "g1", false).games[0].status).toBe(
      "finished"
    )
  })

  it("leaves the passed round untouched", () => {
    const before = round([game("g1", 1, "open")])
    roundWithAllCancelled(before)

    expect(before.games[0].status).toBe("open")
  })
})

describe("committedRound", () => {
  it("turns the running round into a committed one", () => {
    const before = round([game("g1", 1, "finished")])
    const next = committedRound(before)

    expect(next.status).toBe("committed")
    expect(before.status).toBe("active")
  })
})

describe("summaryForRound", () => {
  const summary: DashboardSummary = {
    playerCount: 14,
    gamesTotal: 412,
    gamesToday: 18,
    sessionCount: 37,
  }

  it("counts the open games of the running round", () => {
    const next = summaryForRound(
      summary,
      round([game("g1", 1, "open"), game("g2", 2, "finished")])
    )

    expect(next.activeRound).toEqual({
      id: "r1",
      number: 3,
      openGames: 1,
      totalGames: 2,
    })
  })

  it("removes the hint once no round is running", () => {
    const withRound = summaryForRound(summary, round([game("g1", 1, "open")]))

    expect(summaryForRound(withRound, null).activeRound).toBeUndefined()
  })
})
