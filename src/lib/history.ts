/**
 * Derivations for the history view. The time range itself is a query parameter; what
 * stays here are the pure derivations for ordering and labelling.
 */

import { formatCalendarDay, formatSessionDate } from "./format"
import {
  count_games,
  count_pauses,
  count_players,
  history_cancelled_count,
  summary_games_players_pauses,
  time_range_all,
  time_range_four_weeks,
  time_range_six_months,
} from "@/paraglide/messages.js"
import type { TimeRangeOption } from "./time-range"
import type { RoundSummary, SessionDay } from "./types"

/** Time range above the list — spelled out, because there is room for it here. */
export function historyRangeOptions(): ReadonlyArray<TimeRangeOption> {
  return [
    { value: "all", label: time_range_all() },
    { value: "four-weeks", label: time_range_four_weeks() },
    { value: "six-months", label: time_range_six_months() },
  ]
}

/** A calendar day (`YYYY-MM-DD`) as a local moment. Without the time, `new Date()`
 *  would read it as UTC midnight — west of Greenwich that is the previous day. */
export function sessionDayStart(day: SessionDay): Date {
  return new Date(`${day.date}T00:00:00`)
}

/**
 * Most recent session day on top, most recent round first within a day — the history
 * is read backwards, starting from the latest session rather than the first.
 */
export function sortSessionDays(days: Array<SessionDay>): Array<SessionDay> {
  return days
    .map((day) => ({ ...day, rounds: sortRoundsByRecency(day.rounds) }))
    .toSorted(
      (a, b) => sessionDayStart(b).getTime() - sessionDayStart(a).getTime()
    )
}

export function sortRoundsByRecency(
  rounds: Array<RoundSummary>
): Array<RoundSummary> {
  return rounds.toSorted((a, b) => {
    const byTime =
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    if (byTime !== 0) return byTime

    return b.number - a.number
  })
}

/**
 * Heading of a day group. Without a known `now` it stays the plain date — "today"
 * would be a claim about a moment the server does not know.
 */
export function sessionDayLabel(day: SessionDay, now: Date | null): string {
  const iso = `${day.date}T00:00:00`
  return now ? formatSessionDate(iso, now) : formatCalendarDay(iso)
}

/** Round tally: "3 games · 12 players · 2 pauses". */
export function roundSummaryLabel(round: RoundSummary): string {
  return summary_games_players_pauses({
    games: count_games({ count: round.gameCount }),
    players: count_players({ count: round.playerCount }),
    pauses: count_pauses({ count: round.pausingCount }),
  })
}

/** Badge for cancelled games, `null` when none were cancelled — spelling out a zero
 *  says less than leaving it out. */
export function cancelledLabel(round: RoundSummary): string | null {
  if (round.cancelledCount <= 0) return null

  return history_cancelled_count({ count: round.cancelledCount })
}

export function countRounds(days: Array<SessionDay>): number {
  return days.reduce((total, day) => total + day.rounds.length, 0)
}
