import { describe, expect, it } from "vitest"

import {
  cancelledLabel,
  countRounds,
  roundSummaryLabel,
  sessionDayLabel,
  sortRoundsByRecency,
  sortSessionDays,
} from "./history"
import type { RoundSummary, SessionDay } from "./types"

function round(
  overrides: Partial<RoundSummary> & Pick<RoundSummary, "id" | "startedAt">
): RoundSummary {
  return {
    number: 1,
    status: "committed",
    gameCount: 3,
    cancelledCount: 0,
    playerCount: 12,
    pausingCount: 2,
    ...overrides,
  }
}

function day(date: string, rounds: Array<RoundSummary> = []): SessionDay {
  return { date, rounds }
}

const now = new Date("2026-07-27T20:00:00")

describe("sortSessionDays", () => {
  const unsorted = [
    day("2026-07-20", [
      round({ id: "r1", number: 1, startedAt: "2026-07-20T18:30:00" }),
      round({ id: "r2", number: 2, startedAt: "2026-07-20T19:08:00" }),
    ]),
    day("2026-07-27", [
      round({ id: "r3", number: 1, startedAt: "2026-07-27T18:34:00" }),
    ]),
  ]

  it("puts the most recent session day first", () => {
    expect(sortSessionDays(unsorted).map((d) => d.date)).toEqual([
      "2026-07-27",
      "2026-07-20",
    ])
  })

  it("puts the most recent round of a day first", () => {
    const [, older] = sortSessionDays(unsorted)
    expect(older.rounds.map((r) => r.number)).toEqual([2, 1])
  })

  it("sorts without modifying the input", () => {
    sortSessionDays(unsorted)
    expect(unsorted[0].date).toBe("2026-07-20")
    expect(unsorted[0].rounds[0].number).toBe(1)
  })
})

describe("sortRoundsByRecency", () => {
  it("breaks a tie on start time by round number", () => {
    const sorted = sortRoundsByRecency([
      round({ id: "a", number: 2, startedAt: "2026-07-27T19:00:00" }),
      round({ id: "b", number: 3, startedAt: "2026-07-27T19:00:00" }),
    ])

    expect(sorted.map((r) => r.number)).toEqual([3, 2])
  })
})

describe("sessionDayLabel", () => {
  it("names today's and yesterday's session days", () => {
    expect(sessionDayLabel(day("2026-07-27"), now)).toBe("Heute")
    expect(sessionDayLabel(day("2026-07-26"), now)).toBe("Gestern")
  })

  it("otherwise names the weekday and date", () => {
    expect(sessionDayLabel(day("2026-07-20"), now)).toBe("Montag, 20. Juli")
  })

  it("stays with the date when the current time is unknown", () => {
    expect(sessionDayLabel(day("2026-07-27"), null)).toBe("Montag, 27. Juli")
  })
})

describe("roundSummaryLabel", () => {
  it("names games, players and pauses", () => {
    expect(
      roundSummaryLabel(round({ id: "a", startedAt: "2026-07-27T19:38:00" }))
    ).toBe("3 Spiele · 12 Spieler · 2 Pausen")
  })

  it("inflects game and pause in the singular", () => {
    expect(
      roundSummaryLabel(
        round({
          id: "a",
          startedAt: "2026-07-27T19:38:00",
          gameCount: 1,
          playerCount: 4,
          pausingCount: 1,
        })
      )
    ).toBe("1 Spiel · 4 Spieler · 1 Pause")
  })
})

describe("cancelledLabel", () => {
  it("stays silent when nothing was cancelled", () => {
    expect(
      cancelledLabel(round({ id: "a", startedAt: "2026-07-27T19:38:00" }))
    ).toBeNull()
  })

  it("inflects the count", () => {
    const base = { id: "a", startedAt: "2026-07-27T19:38:00" }
    expect(cancelledLabel(round({ ...base, cancelledCount: 1 }))).toBe(
      "1 abgesagt"
    )
    expect(cancelledLabel(round({ ...base, cancelledCount: 2 }))).toBe(
      "2 abgesagt"
    )
  })
})

describe("countRounds", () => {
  it("counts across all session days", () => {
    expect(
      countRounds([
        day("2026-07-27", [
          round({ id: "a", startedAt: "2026-07-27T18:34:00" }),
          round({ id: "b", startedAt: "2026-07-27T19:06:00" }),
        ]),
        day("2026-07-20", [
          round({ id: "c", startedAt: "2026-07-20T18:30:00" }),
        ]),
      ])
    ).toBe(3)
  })

  it("copes with an empty history", () => {
    expect(countRounds([])).toBe(0)
  })
})
