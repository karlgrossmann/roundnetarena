import { describe, expect, it } from "vitest"

import {
  formatCalendarDay,
  formatDateRange,
  formatDayMonth,
  formatDelta,
  formatFullName,
  formatGameCount,
  formatMonthShort,
  formatGameMoment,
  formatMatchCost,
  formatMatchCostDelta,
  formatRating,
  formatRatingChange,
  formatPlayerCount,
  formatPauseQuota,
  formatScore,
  formatSessionDate,
  formatWeight,
  formatTime,
  formatWinPercentage,
  initialsOf,
  trendOf,
} from "./format"

describe("formatDelta", () => {
  it("shows gains with a plus sign", () => {
    expect(formatDelta(19)).toBe("+19")
  })

  it("uses a real minus sign so columns stay aligned", () => {
    expect(formatDelta(-7)).toBe("−7")
    expect(formatDelta(-7)).not.toBe("-7")
  })

  it("marks zero movement distinctly", () => {
    expect(formatDelta(0)).toBe("±0")
  })

  it("rounds before choosing the sign, so no signed zeros appear", () => {
    expect(formatDelta(0.4)).toBe("±0")
    expect(formatDelta(-0.4)).toBe("±0")
    expect(formatDelta(0.6)).toBe("+1")
  })
})

describe("matcher costs", () => {
  it("formats raw costs compactly with the German decimal separator", () => {
    expect(formatMatchCost(17674.4726, "de")).toBe("17.674,47")
  })

  it("marks the surcharge and treats rounded zeros distinctly", () => {
    expect(formatMatchCostDelta(12.345, "de")).toBe("+12,35")
    expect(formatMatchCostDelta(0.004, "de")).toBe("±0")
  })
})

describe("trendOf", () => {
  it("derives the direction from the rounded value", () => {
    expect(trendOf(3)).toBe("up")
    expect(trendOf(-3)).toBe("down")
    expect(trendOf(0)).toBe("flat")
    expect(trendOf(0.2)).toBe("flat")
  })
})

describe("formatRating", () => {
  it("rounds to whole points", () => {
    expect(formatRating(1631.4)).toBe("1631")
    expect(formatRating(1631.6)).toBe("1632")
  })
})

describe("formatRatingChange", () => {
  it("joins the old and new value with an arrow", () => {
    expect(formatRatingChange(1402, 1421)).toBe("1402 → 1421")
  })

  it("rounds both values the way formatRating does", () => {
    expect(formatRatingChange(1402.4, 1420.6)).toBe("1402 → 1421")
  })
})

describe("formatWinPercentage", () => {
  it("rounds to whole percent", () => {
    expect(formatWinPercentage(18, 31)).toBe("58 %")
  })

  it("shows no invented zero without games played", () => {
    expect(formatWinPercentage(0, 0)).toBe("—")
  })
})

describe("formatWeight", () => {
  it("shows one decimal place with a comma", () => {
    expect(formatWeight(2)).toBe("2,0")
    expect(formatWeight(0.5)).toBe("0,5")
    expect(formatWeight(3.5)).toBe("3,5")
  })
})

describe("locale-aware number and plural formatting", () => {
  it("uses the decimal and percent conventions of the requested locale", () => {
    expect(formatPauseQuota(0.33, "de")).toBe("0,33")
    expect(formatPauseQuota(0.33, "en")).toBe("0.33")
    expect(formatWeight(2, "de")).toBe("2,0")
    expect(formatWeight(2, "en")).toBe("2.0")
    expect(formatWinPercentage(18, 31, "de")).toBe("58 %")
    expect(formatWinPercentage(18, 31, "en")).toBe("58%")
  })

  it("uses the plural rules from the requested locale", () => {
    expect(formatGameCount(1, "de")).toBe("1 Spiel")
    expect(formatGameCount(2, "de")).toBe("2 Spiele")
    expect(formatGameCount(1, "en")).toBe("1 game")
    expect(formatGameCount(2, "en")).toBe("2 games")
    expect(formatPlayerCount(1, "en")).toBe("1 player")
    expect(formatPlayerCount(2, "en")).toBe("2 players")
  })
})

describe("formatScore", () => {
  it("separates with a colon and spaces", () => {
    expect(formatScore(21, 17)).toBe("21 : 17")
  })
})

describe("formatTime", () => {
  it("uses the 24-hour format", () => {
    expect(formatTime("2026-07-27T19:38:00")).toBe("19:38")
  })

  it("uses the time convention of the requested locale", () => {
    expect(formatTime("2026-07-27T19:38:00", "de")).toBe("19:38")
    expect(formatTime("2026-07-27T19:38:00", "en")).toBe("07:38 PM")
  })
})

describe("formatSessionDate", () => {
  const now = new Date("2026-07-27T20:00:00")

  it("names today", () => {
    expect(formatSessionDate("2026-07-27T18:30:00", now)).toBe("Heute")
  })

  it("names the previous day", () => {
    expect(formatSessionDate("2026-07-26T18:30:00", now)).toBe("Gestern")
  })

  it("names weekday and date for older days", () => {
    expect(formatSessionDate("2026-07-20T18:30:00", now)).toBe(
      "Montag, 20. Juli"
    )
  })

  it("adds the year only outside the current year", () => {
    expect(formatSessionDate("2025-11-04T18:30:00", now)).toContain("2025")
  })

  it("formats relative and calendar dates in English", () => {
    expect(formatSessionDate("2026-07-27T18:30:00", now, "en")).toBe("Today")
    expect(formatSessionDate("2026-07-26T18:30:00", now, "en")).toBe(
      "Yesterday"
    )
    expect(formatSessionDate("2026-07-20T18:30:00", now, "en")).toBe(
      "Monday, July 20"
    )
  })
})

describe("formatCalendarDay", () => {
  const now = new Date("2026-07-27T20:00:00")

  it("names weekday, day and month", () => {
    expect(formatCalendarDay("2026-07-20T18:30:00", now)).toBe(
      "Montag, 20. Juli"
    )
  })

  it('names today by its weekday, not as "today"', () => {
    expect(formatCalendarDay("2026-07-27T18:30:00", now)).toBe(
      "Montag, 27. Juli"
    )
  })

  it("adds the year only outside the current one", () => {
    expect(formatCalendarDay("2025-11-04T18:30:00", now)).toContain("2025")
    expect(formatCalendarDay("2026-07-20T18:30:00", now)).not.toContain("2026")
  })

  it("omits the year when the current time is unknown", () => {
    expect(formatCalendarDay("2025-11-04T18:30:00")).toBe(
      "Dienstag, 4. November"
    )
  })
})

describe("formatGameMoment", () => {
  const now = new Date("2026-07-27T20:00:00")

  it("combines day and time", () => {
    expect(formatGameMoment("2026-07-27T19:38:00", now)).toBe("Heute · 19:38")
    expect(formatGameMoment("2026-07-20T20:12:00", now)).toBe(
      "20. Juli · 20:12"
    )
  })
})

describe("formatDayMonth", () => {
  it("names day and month without the weekday", () => {
    expect(formatDayMonth("2026-07-20T20:12:00")).toBe("20. Juli")
  })
})

describe("formatDateRange", () => {
  const range = { from: "2026-01-01", to: "2026-01-31" }

  it("formats custom calendar boundaries without a time zone shift", () => {
    expect(formatDateRange(range, "de")).toBe("01.01.2026–31.01.2026")
    expect(formatDateRange(range, "en")).toBe("01/01/2026–01/31/2026")
  })
})

describe("formatMonthShort", () => {
  it("abbreviates the month for axis labels", () => {
    expect(formatMonthShort("2026-07-20T20:12:00")).toBe("Jul")
  })
})

describe("formatFullName", () => {
  it("joins first and last name", () => {
    expect(formatFullName("Klara", "Nowak")).toBe("Klara Nowak")
  })

  it("tolerates extra whitespace", () => {
    expect(formatFullName(" Klara ", " Nowak ")).toBe("Klara Nowak")
  })

  it("stays at one word without a last name", () => {
    expect(formatFullName("Klara", "")).toBe("Klara")
  })
})

describe("initialsOf", () => {
  it("forms two uppercase letters", () => {
    expect(initialsOf("Klara", "Nowak")).toBe("KN")
  })

  it("tolerates extra whitespace", () => {
    expect(initialsOf(" klara ", " nowak ")).toBe("KN")
  })
})
