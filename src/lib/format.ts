/**
 * Formatting of every number, name and time the UI shows.
 *
 * Components never format themselves: `toFixed`, `toLocaleString` or a hand-rolled
 * date calculation inside a component bypasses this file.
 */

import { count_games } from "@/paraglide/messages/count_games.js"
import { count_players } from "@/paraglide/messages/count_players.js"
import { getLocale } from "@/paraglide/runtime.js"
import type { Locale } from "@/paraglide/runtime.js"

/** Real minus sign (U+2212) rather than a hyphen — same width as the plus, so deltas
 *  line up in columns. */
const MINUS = "−"

function formatInteger(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    useGrouping: false,
  }).format(value)
}

export function formatRating(
  rating: number,
  locale: Locale = getLocale()
): string {
  return formatInteger(Math.round(rating), locale)
}

/** Signed rating change: "+19", "−7", "±0". */
export function formatDelta(
  delta: number,
  locale: Locale = getLocale()
): string {
  const rounded = Math.round(delta)
  if (rounded === 0) return "±0"
  const absolute = formatInteger(Math.abs(rounded), locale)
  return rounded > 0 ? `+${absolute}` : `${MINUS}${absolute}`
}

export function formatMatchCost(
  cost: number,
  locale: Locale = getLocale()
): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(cost)
}

/** Non-negative cost surcharge relative to the chosen lineup. */
export function formatMatchCostDelta(
  delta: number,
  locale: Locale = getLocale()
): string {
  if (Math.abs(delta) < 0.005) return "±0"
  return `+${formatMatchCost(delta, locale)}`
}

/** Rating movement: "1402 → 1421". The arrow carries the direction, so no delta has
 *  to sit next to it. */
export function formatRatingChange(
  before: number,
  after: number,
  locale: Locale = getLocale()
): string {
  return `${formatRating(before, locale)} → ${formatRating(after, locale)}`
}

export type Trend = "up" | "down" | "flat"

export function trendOf(delta: number): Trend {
  const rounded = Math.round(delta)
  if (rounded > 0) return "up"
  if (rounded < 0) return "down"
  return "flat"
}

/** Rating deviation, always shown as an integer. */
export function formatRd(rd: number, locale: Locale = getLocale()): string {
  return formatInteger(Math.round(rd), locale)
}

/** Win rate as a percentage. Without games played there is no rate at all. */
export function formatWinPercentage(
  won: number,
  played: number,
  locale: Locale = getLocale()
): string {
  if (played <= 0) return "—"
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(won / played)
}

export function formatPauseQuota(
  quota: number,
  locale: Locale = getLocale()
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(quota)
}

/** Strong player weight, one decimal place. */
export function formatWeight(
  weight: number,
  locale: Locale = getLocale()
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    useGrouping: false,
  }).format(weight)
}

/** Score: "21 : 17". */
export function formatScore(
  pointsA: number,
  pointsB: number,
  locale: Locale = getLocale()
): string {
  return `${formatInteger(pointsA, locale)} : ${formatInteger(pointsB, locale)}`
}

export function formatTime(iso: string, locale: Locale = getLocale()): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

/**
 * Calendar day without any reference to today. The year only appears when `now` is
 * known and names a different one.
 */
export function formatCalendarDay(
  iso: string,
  now?: Date,
  locale: Locale = getLocale()
): string {
  const date = new Date(iso)

  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year:
      !now || date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  }).format(date)
}

/**
 * Calendar day for group headings. `now` is injectable so tests do not depend on the
 * system clock.
 */
export function formatSessionDate(
  iso: string,
  now: Date = new Date(),
  locale: Locale = getLocale()
): string {
  const date = new Date(iso)
  if (isSameDay(date, now)) return formatRelativeDay(0, locale)

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (isSameDay(date, yesterday)) return formatRelativeDay(-1, locale)

  return formatCalendarDay(iso, now, locale)
}

export function formatDayMonth(
  iso: string,
  locale: Locale = getLocale()
): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
  }).format(new Date(iso))
}

/** Two timezone-free calendar bounds in the locale's short format. */
export function formatDateRange(
  range: Readonly<{ from: string; to: string }>,
  locale: Locale = getLocale()
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  return `${formatter.format(calendarDate(range.from))}–${formatter.format(
    calendarDate(range.to)
  )}`
}

/** Month abbreviation for axis labels. */
export function formatMonthShort(
  iso: string,
  locale: Locale = getLocale()
): string {
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(
    new Date(iso)
  )
}

/** Short form for list entries: relative day plus time. */
export function formatGameMoment(
  iso: string,
  now: Date = new Date(),
  locale: Locale = getLocale()
): string {
  const day = isSameDay(new Date(iso), now)
    ? formatRelativeDay(0, locale)
    : formatDayMonth(iso, locale)

  return `${day} · ${formatTime(iso, locale)}`
}

export function formatGameCount(
  count: number,
  locale: Locale = getLocale()
): string {
  return count_games({ count }, { locale })
}

export function formatPlayerCount(
  count: number,
  locale: Locale = getLocale()
): string {
  return count_players({ count }, { locale })
}

export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim()
}

/** Avatar initials: "Klara Nowak" → "KN". */
export function initialsOf(firstName: string, lastName: string): string {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  return `${first}${last}`.toUpperCase()
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatRelativeDay(value: -1 | 0, locale: Locale): string {
  const formatted = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  }).format(value, "day")
  return formatted.charAt(0).toLocaleUpperCase(locale) + formatted.slice(1)
}

function calendarDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}
