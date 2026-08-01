// @vitest-environment node

import { describe, expect, it } from "vitest"

import { SettingsInputSchema } from "./settings-input"

function input(initialRating: number, initialRd: number) {
  return {
    organizationId: "00000000-0000-4000-8000-000000000001",
    leagueId: "league_test",
    settings: {
      matchingAlgorithm: "default" as const,
      higherRatingWeight: 2,
      pauseMode: "random" as const,
      initialRating,
      initialRd,
      table: {
        columns: ["rating"] as const,
        sortBy: "rating" as const,
        colorRatingChange: true,
      },
    },
  }
}

describe("SettingsInputSchema", () => {
  it("accepts valid starting values including their bounds", () => {
    expect(SettingsInputSchema.safeParse(input(100, 30)).success).toBe(true)
    expect(SettingsInputSchema.safeParse(input(3000, 350)).success).toBe(true)
  })

  it("rejects invalid starting values with understandable messages", () => {
    const result = SettingsInputSchema.safeParse(input(3001, 29))
    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues.map((issue) => issue.message)).toEqual([
      "settings.initial_rating_out_of_range",
      "settings.initial_rd_out_of_range",
    ])
  })

  it("requires persisted defaults to be integers", () => {
    const result = SettingsInputSchema.safeParse(input(1500.5, 125.5))
    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues.map((issue) => issue.message)).toEqual([
      "settings.initial_rating_out_of_range",
      "settings.initial_rd_out_of_range",
    ])
  })
})
