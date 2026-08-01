/**
 * Timestamps for fixtures, in two deliberately separated kinds.
 *
 * **Anchored.** `FIXTURE_NOW` and its derived helpers are fixed. Anything that is merely
 * displayed uses them so tests and stories show the same thing on every run.
 *
 * **Relative.** `hoursAgo()` and `daysAgo()` count from the real clock. They exist only
 * for states that genuinely depend on time passing: `isPoolStale()` compares
 * `pool.updatedAt` against `useNow()`, and an anchored timestamp would read as fresh or
 * stale depending on the calendar day.
 *
 * The relative helpers may only be called inside a function, never at module level —
 * otherwise the value freezes on import and breaks SSR hydration (see
 * `docs/tanstack-patterns.md`).
 */

import type { IsoDateTime } from "../types"

/** Fixed reference point for all anchored fixtures: a Thursday evening. */
export const FIXTURE_NOW: IsoDateTime = "2026-07-23T18:00:00.000Z"

const HOUR_IN_MS = 60 * 60 * 1000
const DAY_IN_MS = 24 * HOUR_IN_MS

/** Anchored: `n` hours before `FIXTURE_NOW`. */
export function fixtureHoursBefore(hours: number): IsoDateTime {
  return new Date(Date.parse(FIXTURE_NOW) - hours * HOUR_IN_MS).toISOString()
}

/** Anchored: `n` days before `FIXTURE_NOW`. */
export function fixtureDaysBefore(days: number): IsoDateTime {
  return new Date(Date.parse(FIXTURE_NOW) - days * DAY_IN_MS).toISOString()
}

/** Relative to the real clock — only for time-dependent states such as a stale pool. */
export function hoursAgo(hours: number): IsoDateTime {
  return new Date(Date.now() - hours * HOUR_IN_MS).toISOString()
}

/** Relative to the real clock — only for time-dependent states. */
export function daysAgo(days: number): IsoDateTime {
  return new Date(Date.now() - days * DAY_IN_MS).toISOString()
}
