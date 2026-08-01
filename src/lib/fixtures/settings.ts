/**
 * Settings and dashboard figures.
 *
 * The values match the schema defaults (`initial_rating` 1500, `initial_rd` 125) —
 * fixtures that deviate do so on purpose.
 */

import { fixtureId } from "./ids"
import type { DashboardSummary, Settings, TableConfig } from "../types"

export function makeTableConfig(
  overrides: Partial<TableConfig> = {}
): TableConfig {
  return {
    columns: ["rating", "rd", "gamesPlayed", "gamesWon", "totalRatingChange"],
    sortBy: "rating",
    colorRatingChange: true,
    ...overrides,
  }
}

export function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    matchingAlgorithm: "default",
    higherRatingWeight: 2,
    pauseMode: "random",
    initialRating: 1500,
    initialRd: 125,
    table: makeTableConfig(),
    ...overrides,
  }
}

/**
 * Dashboard figures. Without overrides a round is in progress with one open game — for
 * the idle state use `makeSummary({ activeRound: undefined })`.
 */
export function makeSummary(
  overrides: Partial<DashboardSummary> = {}
): DashboardSummary {
  return {
    playerCount: 24,
    gamesTotal: 412,
    gamesToday: 9,
    sessionCount: 37,
    activeRound: {
      id: fixtureId("block", 1),
      number: 4,
      openGames: 1,
      totalGames: 3,
    },
    ...overrides,
  }
}
