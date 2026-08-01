import { afterEach, describe, expect, it } from "vitest"

import { historyRangeOptions, roundSummaryLabel } from "./history"
import { columnLabel } from "./leaderboard"
import { playerRefDisplayName } from "./player-display"
import { ratingRangeOptions } from "./player-view"
import { poolSummaryLabel } from "./pool"
import { overwriteGetLocale } from "@/paraglide/runtime.js"

afterEach(() => {
  overwriteGetLocale(() => "de")
})

describe("localized UI derivations", () => {
  it("renders English labels and summaries without German fragments", () => {
    overwriteGetLocale(() => "en")

    expect(historyRangeOptions().map((option) => option.label)).toEqual([
      "All",
      "4 weeks",
      "6 months",
    ])
    expect(ratingRangeOptions().map((option) => option.label)).toEqual([
      "4w",
      "6m",
      "All",
    ])
    expect(columnLabel("gamesWon")).toBe("Wins")
    expect(poolSummaryLabel({ playing: 8, paused: 2, absent: 1 })).toBe(
      "8 playing · 2 paused"
    )
    expect(
      roundSummaryLabel({
        id: "round",
        number: 3,
        startedAt: "2026-07-28T18:00:00Z",
        status: "committed",
        gameCount: 2,
        playerCount: 8,
        pausingCount: 1,
        cancelledCount: 0,
      })
    ).toBe("2 games · 8 players · 1 pause")
  })

  it("localizes anonymized player names only at the display boundary", () => {
    const player = {
      id: "player",
      displayName: "anon_1234",
      anonymizedKey: "anon_1234",
      rating: 1500,
    }

    expect(playerRefDisplayName(player)).toBe("Gelöschter Spieler (anon_1234)")
    overwriteGetLocale(() => "en")
    expect(playerRefDisplayName(player)).toBe("Deleted player (anon_1234)")
  })
})
