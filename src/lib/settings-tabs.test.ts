import { describe, expect, it } from "vitest"

import { settingsSearchSchema } from "./settings-tabs"

describe("settingsSearchSchema", () => {
  it("opens the account tab without a search parameter", () => {
    expect(settingsSearchSchema.parse({})).toEqual({ tab: "account" })
  })

  it("keeps valid tabs and falls back to account for invalid values", () => {
    expect(settingsSearchSchema.parse({ tab: "organization" })).toEqual({
      tab: "organization",
    })
    expect(settingsSearchSchema.parse({ tab: "league" })).toEqual({
      tab: "league",
    })
    expect(settingsSearchSchema.parse({ tab: "unknown" })).toEqual({
      tab: "account",
    })
  })
})
