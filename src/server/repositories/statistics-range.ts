import "@tanstack/react-start/server-only"

import { sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"

import type { TimeRange } from "@/lib/time-range"
import { isCustomTimeRange } from "@/lib/time-range"

/**
 * Filters timestamps by the domain session day in Europe/Berlin. A session day rolls
 * over at 05:00; `from` and `to` are inclusive.
 */
export function statisticsRangeCondition(
  timestamp: SQL,
  range: TimeRange
): SQL {
  if (range === "all") return sql`true`

  const sessionDay = sql`
    date_trunc(
      'day',
      (${timestamp} at time zone 'Europe/Berlin') - interval '5 hours'
    )::date
  `

  if (isCustomTimeRange(range)) {
    return sql`
      ${sessionDay} >= ${range.from}::date
      and ${sessionDay} <= ${range.to}::date
    `
  }

  const currentSessionDay = sql`
    date_trunc(
      'day',
      (now() at time zone 'Europe/Berlin') - interval '5 hours'
    )::date
  `
  const start =
    range === "four-weeks"
      ? sql`${currentSessionDay} - 28`
      : sql`(${currentSessionDay} - interval '6 months')::date`

  return sql`${sessionDay} >= ${start} and ${sessionDay} <= ${currentSessionDay}`
}
