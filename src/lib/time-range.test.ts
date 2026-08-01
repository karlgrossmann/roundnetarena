import { describe, expect, it } from "vitest"

import {
  isCalendarDate,
  isWithinRange,
  statisticsDay,
  timeRangeKey,
  timeRangeStart,
  validateCustomTimeRange,
} from "./time-range"

const now = new Date("2026-07-27T20:00:00")

describe("timeRangeStart", () => {
  it("has no boundary for the all-time range", () => {
    expect(timeRangeStart("all", now)).toBeNull()
  })

  it("counts four weeks back from the start of the day", () => {
    expect(timeRangeStart("four-weeks", now)).toEqual(
      new Date("2026-06-29T00:00:00")
    )
  })

  it("counts six months back by calendar", () => {
    expect(timeRangeStart("six-months", now)).toEqual(
      new Date("2026-01-27T00:00:00")
    )
  })
})

describe("isWithinRange", () => {
  it("accepts timestamps inside the boundary", () => {
    expect(isWithinRange("2026-07-20T19:00:00", "four-weeks", now)).toBe(true)
  })

  it("rejects older timestamps", () => {
    expect(isWithinRange("2026-06-02T19:00:00", "four-weeks", now)).toBe(false)
    expect(isWithinRange("2026-06-02T19:00:00", "six-months", now)).toBe(true)
  })

  it("includes the start of the boundary day", () => {
    expect(isWithinRange("2026-06-29T00:00:00", "four-weeks", now)).toBe(true)
  })

  it("does not filter while the current time is unknown", () => {
    expect(isWithinRange("2020-01-01T19:00:00", "four-weeks", null)).toBe(true)
  })

  it("includes both calendar days of a custom range", () => {
    const range = {
      kind: "custom",
      from: "2026-07-20",
      to: "2026-07-27",
    } as const

    expect(isWithinRange("2026-07-20T05:00:00+02:00", range, null)).toBe(true)
    expect(isWithinRange("2026-07-28T04:59:00+02:00", range, null)).toBe(true)
    expect(isWithinRange("2026-07-28T05:00:00+02:00", range, null)).toBe(false)
  })
})

describe("validateCustomTimeRange", () => {
  it("accepts a complete, ascending date range", () => {
    expect(validateCustomTimeRange("2026-02-01", "2026-02-28")).toEqual({
      valid: true,
      range: { kind: "custom", from: "2026-02-01", to: "2026-02-28" },
    })
  })

  it("reports each missing boundary separately", () => {
    expect(validateCustomTimeRange("", "").valid).toBe(false)
    expect(validateCustomTimeRange("", "2026-02-28")).toMatchObject({
      issue: { code: "time_range.from_required" },
    })
    expect(validateCustomTimeRange("2026-02-01", "")).toMatchObject({
      issue: { code: "time_range.to_required" },
    })
  })

  it("rejects invalid and swapped calendar dates understandably", () => {
    expect(validateCustomTimeRange("2026-02-30", "2026-03-01")).toMatchObject({
      issue: { code: "time_range.from_invalid" },
    })
    expect(validateCustomTimeRange("2026-03-02", "2026-03-01")).toMatchObject({
      issue: { code: "time_range.invalid_order" },
    })
  })
})

describe("calendar and query helpers", () => {
  it("recognizes real calendar dates, not just the text format", () => {
    expect(isCalendarDate("2024-02-29")).toBe(true)
    expect(isCalendarDate("2026-02-29")).toBe(false)
    expect(isCalendarDate("29.02.2024")).toBe(false)
  })

  it("builds stable query key segments", () => {
    expect(timeRangeKey("six-months")).toEqual(["six-months"])
    expect(
      timeRangeKey({ kind: "custom", from: "2026-01-01", to: "2026-01-31" })
    ).toEqual(["custom", "2026-01-01", "2026-01-31"])
  })
})

describe("statisticsDay", () => {
  it("draws the Berlin day boundary at 05:00", () => {
    expect(statisticsDay("2026-07-28T04:59:00+02:00")).toBe("2026-07-27")
    expect(statisticsDay("2026-07-28T05:00:00+02:00")).toBe("2026-07-28")
  })

  it("accounts for Berlin summer and winter time", () => {
    expect(statisticsDay("2026-01-15T04:30:00+01:00")).toBe("2026-01-14")
    expect(statisticsDay("2026-07-15T04:30:00+02:00")).toBe("2026-07-14")
  })
})
