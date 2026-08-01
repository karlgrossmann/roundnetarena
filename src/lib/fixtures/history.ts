/**
 * History fixtures: committed rounds grouped by session day.
 *
 * Committed rounds are immutable — the history has no edit path, so these fixtures only
 * cover `committed`.
 */

import { fixtureId } from "./ids"
import { FIXTURE_NOW, fixtureDaysBefore, fixtureHoursBefore } from "./time"
import type { RoundSummary, SessionDay } from "../types"

/** Calendar day of a timestamp, in the shape `SessionDay.date` expects. */
function dayOf(timestamp: string): string {
  return timestamp.slice(0, 10)
}

export function makeRoundSummary(
  overrides: Partial<RoundSummary> = {}
): RoundSummary {
  return {
    id: fixtureId("block", 1),
    number: 1,
    startedAt: fixtureHoursBefore(3),
    status: "committed",
    gameCount: 3,
    cancelledCount: 0,
    playerCount: 12,
    pausingCount: 2,
    ...overrides,
  }
}

/**
 * A session day with `roundCount` rounds, in play order.
 *
 * `dayOffset` shifts it back by whole days; `0` is the session day of `FIXTURE_NOW`.
 */
export function makeSessionDay(roundCount = 4, dayOffset = 0): SessionDay {
  const dayStart = dayOffset === 0 ? FIXTURE_NOW : fixtureDaysBefore(dayOffset)

  return {
    date: dayOf(dayStart),
    rounds: Array.from({ length: roundCount }, (_unused, index) =>
      makeRoundSummary({
        id: fixtureId("block", dayOffset * 100 + index + 1),
        number: index + 1,
        startedAt: fixtureHoursBefore(dayOffset * 24 + (roundCount - index)),
        gameCount: 2 + (index % 3),
        // One cancelled game in the set — the display has to handle both.
        cancelledCount: index === 1 ? 1 : 0,
        playerCount: 10 + (index % 5),
        pausingCount: index % 3,
      })
    ),
  }
}

/** Several session days, most recent first — the order `fetchHistory()` returns. */
export function makeHistory(dayCount = 3): Array<SessionDay> {
  return Array.from({ length: dayCount }, (_unused, index) =>
    makeSessionDay(4 - (index % 2), index * 7)
  )
}
