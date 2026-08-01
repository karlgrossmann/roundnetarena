import { describe, expect, it } from "vitest"

import { TimeRangeSchema } from "./statistics-range"

describe("TimeRangeSchema", () => {
  it("accepts quick filters and valid custom ranges", () => {
    expect(TimeRangeSchema.safeParse("four-weeks").success).toBe(true)
    expect(
      TimeRangeSchema.safeParse({
        kind: "custom",
        from: "2026-01-01",
        to: "2026-01-31",
      }).success
    ).toBe(true)
  })

  it("repeats the range validation at the server boundary", () => {
    const result = TimeRangeSchema.safeParse({
      kind: "custom",
      from: "2026-02-10",
      to: "2026-02-01",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("time_range.invalid_order")
    }
  })
})
