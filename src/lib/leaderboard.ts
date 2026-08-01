/**
 * Derivations for the leaderboard table.
 *
 * Everything here is pure and React-free — the table only renders. What can break
 * silently (ranks on a tie, the derived win rate, the search filter) lives here and is
 * covered by tests.
 */

import type { LeaderboardPlayer, Pool, TableColumn } from "./types"
import {
  column_games_lost,
  column_games_played,
  column_games_won,
  column_rating,
  column_rd,
  column_total_rating_change,
  column_win_percentage,
} from "@/paraglide/messages.js"

/** Every toggleable column in the order the table shows them. */
export const ALL_TABLE_COLUMNS: Array<TableColumn> = [
  "rating",
  "rd",
  "gamesPlayed",
  "gamesWon",
  "gamesLost",
  "winPercentage",
  "totalRatingChange",
]

export function columnLabel(column: TableColumn): string {
  switch (column) {
    case "rating":
      return column_rating()
    case "rd":
      return column_rd()
    case "gamesPlayed":
      return column_games_played()
    case "gamesWon":
      return column_games_won()
    case "gamesLost":
      return column_games_lost()
    case "winPercentage":
      return column_win_percentage()
    case "totalRatingChange":
      return column_total_rating_change()
  }
}

/**
 * Win rate as a fraction between 0 and 1 — the value sorting runs on.
 *
 * Without games played there is no rate. Sorting then counts it as 0, while
 * `formatWinPercentage()` displays an em dash rather than an invented zero.
 */
export function winRate(player: LeaderboardPlayer): number {
  if (player.gamesPlayed <= 0) return 0
  return player.gamesWon / player.gamesPlayed
}

/** Sort value of a column. The win rate is not a player field but derived. */
export function columnValue(
  player: LeaderboardPlayer,
  column: TableColumn
): number {
  if (column === "winPercentage") return winRate(player)
  return player[column]
}

/** Case-insensitive filter on the display name. Purely client-side and without a
 *  debounce, given how little data there is. */
export function filterPlayers(
  players: Array<LeaderboardPlayer>,
  query: string
): Array<LeaderboardPlayer> {
  const needle = query.trim().toLowerCase()
  if (needle === "") return players
  return players.filter((player) =>
    player.displayName.toLowerCase().includes(needle)
  )
}

/**
 * Limits the table to everyone playing or voluntarily pausing today. Stored `absent`
 * entries (for instance from an inactive fixed team) are not current pool members.
 */
export function filterPlayersByPool(
  players: Array<LeaderboardPlayer>,
  pool: Pool,
  onlyCurrentPool: boolean
): Array<LeaderboardPlayer> {
  if (!onlyCurrentPool) return players

  const currentPlayerIds = new Set(
    pool.entries
      .filter((entry) => entry.status !== "absent")
      .map((entry) => entry.player.id)
  )
  return players.filter((player) => currentPlayerIds.has(player.id))
}

export function filterPlayersByIds(
  players: Array<LeaderboardPlayer>,
  currentPlayerIds: ReadonlySet<string>,
  onlyCurrentPool: boolean
): Array<LeaderboardPlayer> {
  return onlyCurrentPool
    ? players.filter((player) => currentPlayerIds.has(player.id))
    : players
}

/**
 * Ranks for an already sorted list of ratings.
 *
 * A player with the same rating as the one above keeps an empty rank (`null`) — that is
 * what the backend does too, instead of giving two players the same rank or skipping
 * one. The input is the display order so the numbering matches the visible sorting.
 */
export function assignRanks(ratings: Array<number>): Array<number | null> {
  return ratings.map((rating, index) =>
    index > 0 && ratings[index - 1] === rating ? null : index + 1
  )
}
