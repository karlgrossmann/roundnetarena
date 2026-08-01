import { describe, expect, it } from "vitest"

import { formatGreeting, greetingPhase } from "./greeting"

/** A timestamp at the given hour in the viewer's time zone. */
function atHour(hour: number): Date {
  return new Date(2026, 6, 31, hour, 30)
}

describe("greetingPhase", () => {
  it("splits the day at the four boundaries", () => {
    expect(greetingPhase(5)).toBe("morning")
    expect(greetingPhase(10)).toBe("morning")
    expect(greetingPhase(11)).toBe("day")
    expect(greetingPhase(17)).toBe("day")
    expect(greetingPhase(18)).toBe("evening")
    expect(greetingPhase(22)).toBe("evening")
    expect(greetingPhase(23)).toBe("night")
  })

  it("still counts the hours after midnight as night", () => {
    expect(greetingPhase(0)).toBe("night")
    expect(greetingPhase(4)).toBe("night")
  })
})

describe("formatGreeting", () => {
  it("greets by time of day, in German and in English", () => {
    expect(formatGreeting("Alex", atHour(8), "de")).toBe("Guten Morgen, Alex")
    expect(formatGreeting("Alex", atHour(8), "en")).toBe("Good morning, Alex")
    expect(formatGreeting("Alex", atHour(20), "de")).toBe("Guten Abend, Alex")
    expect(formatGreeting("Alex", atHour(20), "en")).toBe("Good evening, Alex")
  })

  it("stays with the neutral wording when no timestamp is given", () => {
    // Before hydration no timestamp is available — the text still has to be right.
    expect(formatGreeting("Alex", null, "de")).toBe("Hallo, Alex")
    expect(formatGreeting("Alex", null, "en")).toBe("Hello, Alex")
  })

  it("does not switch at midday, where the neutral wording applies", () => {
    expect(formatGreeting("Alex", atHour(14), "de")).toBe(
      formatGreeting("Alex", null, "de")
    )
  })
})
