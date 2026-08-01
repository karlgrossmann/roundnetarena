import { domainIssue } from "./domain-errors"
import type { DomainIssue } from "./domain-errors"

/**
 * Time range selection shared by the history and the rating chart.
 *
 * The values are domain-level, the labels are not: the history spells out "4 weeks"
 * while the chart shortens it, because there is less room. The labels therefore live
 * with each page and only the arithmetic lives here.
 */

export type TimeRangePreset = "all" | "four-weeks" | "six-months"

export interface CustomTimeRange {
  kind: "custom"
  /** Local calendar date in `YYYY-MM-DD` format. */
  from: string
  /** Local calendar date in `YYYY-MM-DD` format. */
  to: string
}

export type TimeRange = TimeRangePreset | CustomTimeRange

export interface TimeRangeOption {
  value: TimeRangePreset
  label: string
}

const DAYS_IN_FOUR_WEEKS = 28
const MONTHS_IN_HALF_YEAR = 6
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export type CustomTimeRangeValidation =
  { valid: true; range: CustomTimeRange } | { valid: false; issue: DomainIssue }

export function isCustomTimeRange(range: TimeRange): range is CustomTimeRange {
  return typeof range === "object"
}

/** Stable, complete portion of a TanStack query key. */
export function timeRangeKey(
  range: TimeRange
): readonly [TimeRangePreset] | readonly ["custom", string, string] {
  return isCustomTimeRange(range) ? ["custom", range.from, range.to] : [range]
}

/**
 * Validates the two native date inputs before they turn into a server query.
 *
 * Calendar dates are deliberately not checked via `new Date("YYYY-MM-DD")`: that
 * constructor reads them as UTC and can shift the visible date in another timezone.
 */
export function validateCustomTimeRange(
  from: string,
  to: string
): CustomTimeRangeValidation {
  if (from === "" && to === "") {
    return { valid: false, issue: domainIssue("time_range.both_required") }
  }
  if (from === "") {
    return { valid: false, issue: domainIssue("time_range.from_required") }
  }
  if (to === "") {
    return { valid: false, issue: domainIssue("time_range.to_required") }
  }
  if (!isCalendarDate(from)) {
    return { valid: false, issue: domainIssue("time_range.from_invalid") }
  }
  if (!isCalendarDate(to)) {
    return { valid: false, issue: domainIssue("time_range.to_invalid") }
  }
  if (from > to) {
    return {
      valid: false,
      issue: domainIssue("time_range.invalid_order"),
    }
  }

  return { valid: true, range: { kind: "custom", from, to } }
}

export function isCalendarDate(value: string): boolean {
  const match = DATE_ONLY_PATTERN.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

/**
 * Earliest bound of the chosen range; `null` means unbounded.
 *
 * Calculated from the start of the day, not from the moment of the call: otherwise an
 * event exactly four weeks old would fall in or out depending on the time of day.
 */
export function timeRangeStart(range: TimeRangePreset, now: Date): Date | null {
  if (range === "all") return null

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (range === "four-weeks") {
    start.setDate(start.getDate() - DAYS_IN_FOUR_WEEKS)
  } else {
    start.setMonth(start.getMonth() - MONTHS_IN_HALF_YEAR)
  }

  return start
}

/**
 * Is the moment inside the chosen range?
 *
 * `now` is `null` while the current moment is not established (before hydration, see
 * `useNow`). Nothing is filtered then — better to show everything than to hide
 * something based on a guessed time.
 */
export function isWithinRange(
  iso: string,
  range: TimeRange,
  now: Date | null
): boolean {
  if (isCustomTimeRange(range)) {
    const day = statisticsDay(iso)
    return day >= range.from && day <= range.to
  }
  if (!now) return true

  const start = timeRangeStart(range, now)
  if (!start) return true

  return new Date(iso) >= start
}

/**
 * Session day of a moment: Europe/Berlin, day boundary at 05:00. This matches the SQL
 * boundary from the implementation plan.
 */
export function statisticsDay(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso))
  const values = new Map(parts.map((part) => [part.type, part.value]))
  const year = Number(values.get("year"))
  const month = Number(values.get("month"))
  const day = Number(values.get("day"))
  const hour = Number(values.get("hour"))

  if (hour >= 5) return dateParts(year, month, day)

  const previous = new Date(Date.UTC(year, month - 1, day - 1))
  return dateParts(
    previous.getUTCFullYear(),
    previous.getUTCMonth() + 1,
    previous.getUTCDate()
  )
}

function dateParts(year: number, month: number, day: number): string {
  return [year, month, day]
    .map((part, index) =>
      index === 0
        ? String(part).padStart(4, "0")
        : String(part).padStart(2, "0")
    )
    .join("-")
}
