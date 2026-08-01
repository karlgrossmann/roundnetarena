/**
 * Derivations for the player page: rank, time range selection and what a removal
 * actually does. Everything here is pure and React-free.
 */

import { PLAYER_NOT_FOUND_MESSAGE } from "./api/queries"
import {
  player_anonymize_description,
  player_delete_description,
  player_rank,
  time_range_all,
  time_range_description_all,
  time_range_description_four_weeks,
  time_range_description_six_months,
  time_range_four_weeks_short,
  time_range_six_months_short,
} from "@/paraglide/messages.js"
import {
  formatDateRange,
  formatFullName,
  formatGameMoment,
  formatTime,
} from "./format"
import { assignRanks } from "./leaderboard"
import type { PlayerRemoval } from "./player-removal"
import { isCustomTimeRange, isWithinRange } from "./time-range"
import type { TimeRange, TimeRangeOption, TimeRangePreset } from "./time-range"
import type { Player, PlayerGame, PlayerId, RatingPoint } from "./types"

/** Time range above the chart and games — labelled short, because it sits in a card
 *  header next to that card's title. */
export function ratingRangeOptions(): ReadonlyArray<TimeRangeOption> {
  return [
    { value: "four-weeks", label: time_range_four_weeks_short() },
    { value: "six-months", label: time_range_six_months_short() },
    { value: "all", label: time_range_all() },
  ]
}

/** The chosen time range as a subtitle next to "games". */
export function rangeDescription(range: TimeRange): string {
  if (isCustomTimeRange(range)) {
    return formatDateRange(range)
  }
  const descriptions: Record<TimeRangePreset, () => string> = {
    "four-weeks": time_range_description_four_weeks,
    "six-months": time_range_description_six_months,
    all: time_range_description_all,
  }
  return descriptions[range]()
}

/**
 * Rank within the rating-sorted list; `null` when the player is not part of it.
 *
 * The rank is not a player field but their position among all others, so it has to
 * follow the same rule here as in the table. On a tie both share the rank instead of
 * one getting an invented number.
 */
export function playerRank(
  players: Array<Player>,
  playerId: PlayerId
): number | null {
  const byRating = players.toSorted((a, b) => b.rating - a.rating)
  const index = byRating.findIndex((player) => player.id === playerId)
  if (index < 0) return null

  const ranks = assignRanks(byRating.map((player) => player.rating))

  // `null` means "same rating as the one above" — then that rank applies here too.
  for (let position = index; position >= 0; position -= 1) {
    const rank = ranks[position]
    if (rank !== null) return rank
  }

  return null
}

/** Header subtitle: "rank 2 · RD 52". Without a rank the RD stands alone — an invented
 *  zero would be worse than a missing value. */
export function playerStandingLabel(rank: number | null, rd: number): string {
  const rounded = Math.round(rd)
  return rank === null ? `RD ${rounded}` : player_rank({ rank, rd: rounded })
}

export function playerFullName(player: Player): string {
  return formatFullName(player.firstName, player.lastName)
}

/** Rating points in the chosen range, ascending by time — a chart is read left to
 *  right. */
export function filterRatingPoints(
  points: Array<RatingPoint>,
  range: TimeRange,
  now: Date | null
): Array<RatingPoint> {
  return points
    .filter((point) => isWithinRange(point.timestamp, range, now))
    .toSorted(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
}

/** A chart needs at least two points — a single one is a dot, not a progression. */
export const MIN_CHART_POINTS = 2

/** Games in the chosen range, most recent first. */
export function filterPlayerGames(
  games: Array<PlayerGame>,
  range: TimeRange,
  now: Date | null
): Array<PlayerGame> {
  return games
    .filter((game) => isWithinRange(game.timestamp, range, now))
    .toSorted(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
}

/** Moment of a game; without a known `now` it drops the word "today", which would be a
 *  claim about a moment the server does not know. */
export function gameMomentLabel(iso: string, now: Date | null): string {
  return now ? formatGameMoment(iso, now) : formatTime(iso)
}

/** Rating change of a game from the viewed player's perspective. */
export function gameDelta(game: PlayerGame): number {
  return game.ratingAfter - game.ratingBefore
}

/** An unknown id is not an application error but a path into the void, and is
 *  therefore explained differently from a failed query. */
export function isPlayerNotFound(error: unknown): boolean {
  return error instanceof Error && error.message === PLAYER_NOT_FOUND_MESSAGE
}

/** Explanation in the confirmation dialog — it names the difference instead of only
 *  asking "really delete?". */
export function playerRemovalDescription(
  player: Player,
  removal: PlayerRemoval
): string {
  const name = playerFullName(player)

  if (removal === "deleted") {
    return player_delete_description({ name })
  }

  return player_anonymize_description({ name })
}
