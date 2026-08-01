/**
 * Time-of-day greeting.
 *
 * The viewer's timezone is the correct one — a session day starts where people play,
 * not where the server stands. The moment therefore comes from outside (`useNow`) and
 * is `null` before hydration; until then the neutral wording applies.
 */

import { greeting_day } from "@/paraglide/messages/greeting_day.js"
import { greeting_evening } from "@/paraglide/messages/greeting_evening.js"
import { greeting_morning } from "@/paraglide/messages/greeting_morning.js"
import { greeting_night } from "@/paraglide/messages/greeting_night.js"
import { getLocale } from "@/paraglide/runtime.js"
import type { Locale } from "@/paraglide/runtime.js"

export type GreetingPhase = "morning" | "day" | "evening" | "night"

const MORNING_START = 5
const DAY_START = 11
const EVENING_START = 18
const NIGHT_START = 23

/** Phase of the day for a full hour (0–23). */
export function greetingPhase(hour: number): GreetingPhase {
  if (hour >= NIGHT_START || hour < MORNING_START) return "night"
  if (hour >= EVENING_START) return "evening"
  if (hour >= DAY_START) return "day"
  return "morning"
}

/**
 * Without a moment — that is, before hydration — this reads the same as during the day.
 * The text therefore only visibly switches in the morning, evening and at night.
 */
export function formatGreeting(
  name: string,
  at: Date | null,
  locale: Locale = getLocale()
): string {
  const options = { locale }
  const phase = at ? greetingPhase(at.getHours()) : "day"

  switch (phase) {
    case "morning":
      return greeting_morning({ name }, options)
    case "evening":
      return greeting_evening({ name }, options)
    case "night":
      return greeting_night({ name }, options)
    case "day":
      return greeting_day({ name }, options)
  }
}
