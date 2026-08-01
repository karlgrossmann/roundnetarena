import { describe, expect, it } from "vitest"

import { parseScoreInput, validateScore, winnerOf } from "./score"

describe("validateScore", () => {
  it("accepts a regular result without asking back", () => {
    const result = validateScore(21, 17)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
  })

  it("rejects a draw", () => {
    const result = validateScore(21, 21)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({ code: "score.draw_not_allowed" })
  })

  it("rejects negative points", () => {
    expect(validateScore(-1, 21).isValid).toBe(false)
  })

  it("rejects fractional points", () => {
    expect(validateScore(20.5, 15).isValid).toBe(false)
  })

  it("asks back when neither team reached 15 points", () => {
    const result = validateScore(12, 9)
    expect(result.isValid).toBe(true)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toEqual({
      code: "score.minimum_not_reached",
      values: { minimum: 15 },
    })
  })

  it("asks back on an extended set with too large a margin", () => {
    const result = validateScore(28, 12)
    expect(result.isValid).toBe(true)
    expect(result.warnings[0]).toEqual({ code: "score.extended_margin" })
  })

  it("accepts a regular extension", () => {
    expect(validateScore(23, 21).warnings).toHaveLength(0)
  })

  it("reports no extra warnings for invalid values", () => {
    const result = validateScore(-5, -9)
    expect(result.warnings).toHaveLength(0)
  })
})

describe("parseScoreInput", () => {
  it("reads whole numbers from both fields", () => {
    expect(parseScoreInput("21", " 17 ")).toEqual({ pointsA: 21, pointsB: 17 })
  })

  it("waits as long as one field is empty", () => {
    expect(parseScoreInput("21", "")).toBeNull()
    expect(parseScoreInput("", "")).toBeNull()
  })

  it("rejects input that is not a number", () => {
    expect(parseScoreInput("zwölf", "9")).toBeNull()
    expect(parseScoreInput("20,5", "9")).toBeNull()
  })

  it("lets negative values through — the message for them comes from validateScore", () => {
    expect(parseScoreInput("-1", "21")).toEqual({ pointsA: -1, pointsB: 21 })
  })
})

describe("winnerOf", () => {
  it("determines the winning team", () => {
    expect(winnerOf(21, 17)).toBe("a")
    expect(winnerOf(17, 21)).toBe("b")
  })

  it("knows no winner on a tie", () => {
    expect(winnerOf(21, 21)).toBeNull()
  })
})
