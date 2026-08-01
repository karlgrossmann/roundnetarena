import { describe, expect, it } from "vitest"

import {
  predictDoublesOutcome,
  rateDoublesGame,
  timeAdjustedRd,
} from "./glicko"
import type { GlickoRating } from "./glicko"

const BEFORE = "2026-07-01T18:00:00.000Z"
const PLAYED_AT = "2026-07-01T19:00:00.000Z"

function rating(playerId: string, value: number, rd: number): GlickoRating {
  return {
    playerId,
    rating: value,
    rd,
    vol: 0.06,
    timestamp: BEFORE,
  }
}

describe("rateDoublesGame", () => {
  it("matches the frozen Python reference", () => {
    const result = rateDoublesGame({
      teamA: [rating("a1", 1662, 48), rating("a2", 1402, 77)],
      teamB: [rating("b1", 1638, 52), rating("b2", 1416, 71)],
      pointsA: 21,
      pointsB: 17,
      timestamp: PLAYED_AT,
    })

    expect(
      result.map(({ playerId, rating: value }) => [playerId, value])
    ).toEqual([
      ["a1", 1664],
      ["a2", 1407],
      ["b1", 1636],
      ["b2", 1412],
    ])
    expect(result.map((entry) => entry.rd)).toEqual([
      48.652493361615875, 75.89566793111929, 52.449687945518754,
      70.33229899498302,
    ])
  })

  it("rejects a draw", () => {
    expect(() =>
      rateDoublesGame({
        teamA: [rating("a1", 1500, 125), rating("a2", 1500, 125)],
        teamB: [rating("b1", 1500, 125), rating("b2", 1500, 125)],
        pointsA: 21,
        pointsB: 21,
        timestamp: PLAYED_AT,
      })
    ).toThrow("glicko.invalid_score")
  })
})

describe("timeAdjustedRd", () => {
  it("only starts increasing after five elapsed days, per week", () => {
    expect(timeAdjustedRd(100, BEFORE, "2026-07-05T18:00:00.000Z")).toBe(100)
    expect(timeAdjustedRd(100, BEFORE, "2026-07-06T18:00:00.000Z")).toBeCloseTo(
      Math.sqrt(100 ** 2 + 25 ** 2)
    )
  })
})

describe("predictDoublesOutcome", () => {
  it("is even for identical teams", () => {
    const team = [rating("a", 1500, 100), rating("b", 1500, 100)] as [
      GlickoRating,
      GlickoRating,
    ]
    expect(predictDoublesOutcome(team, team)).toBeCloseTo(0.5)
  })
})
