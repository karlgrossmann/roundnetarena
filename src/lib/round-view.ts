/**
 * Derivations for viewing a round, running or committed: game order, the sentences
 * beside them and the tally afterwards.
 *
 * Complements `round.ts` the way `pool.ts` does for the pool: that file holds the
 * rules the backend knows as well, this one everything only the UI needs.
 */

import { PLAYERS_PER_GAME, commitBlockedReason, countByStatus } from "./round"
import { translateDomainIssue } from "./i18n"
import { playerRefDisplayName } from "./player-display"
import { getLocale } from "@/paraglide/runtime.js"
import {
  count_games,
  count_pauses,
  count_players,
  game_status_cancelled,
  game_status_finished,
  game_status_open,
  history_cancelled_count,
  round_commit_cancelled_hint,
  round_commit_final_hint,
  round_pause_reason_assigned,
  round_pause_reason_voluntary,
  round_pause_uniform_reason,
  round_pause_uniform_many,
  round_pause_uniform_two,
  round_progress_done_label,
  round_progress_entered_label,
  summary_games_players_pauses,
} from "@/paraglide/messages.js"
import type {
  Game,
  GameStatus,
  PausingPlayer,
  RatingChange,
  Round,
} from "./types"

/**
 * Game list order: the court number, and nothing else.
 *
 * The order must not change while results are entered. Someone at the edge of the
 * court looks at court 3 and expects its card where it just was — if it slides down on
 * save, the next entry easily lands on the wrong card. Status therefore shows on the
 * card, not in the ordering.
 */
export function sortGamesByCourt(games: Array<Game>): Array<Game> {
  return games.toSorted((a, b) => a.court - b.court)
}

export function gameStatusLabel(status: GameStatus): string {
  const labels: Record<GameStatus, () => string> = {
    open: game_status_open,
    finished: game_status_finished,
    cancelled: game_status_cancelled,
  }
  return labels[status]()
}

/**
 * Progress in words: "1 of 3 games entered".
 *
 * Cancelled games count as done — the wording then says "done" instead of "entered",
 * because nobody typed a result for a cancellation.
 */
export function roundProgressLabel(round: Round): string {
  const total = round.games.length
  const done = total - countByStatus(round.games, "open")
  return countByStatus(round.games, "cancelled") > 0
    ? round_progress_done_label({ done, total })
    : round_progress_entered_label({ done, total })
}

/**
 * Who sits out and why: "Ida K., Nora T. — both voluntarily".
 *
 * The reason is included because it regularly prompts questions courtside. When the
 * reasons differ it belongs on each name — a collective statement would be wrong.
 */
export function pausingSummary(pausing: Array<PausingPlayer>): string {
  if (pausing.length === 0) return ""

  const reasonLabel = (reason: PausingPlayer["reason"]) =>
    reason === "voluntary"
      ? round_pause_reason_voluntary()
      : round_pause_reason_assigned()
  const [first] = pausing
  const uniform = pausing.every((entry) => entry.reason === first.reason)
  if (!uniform) {
    return pausing
      .map(
        (entry) =>
          `${playerRefDisplayName(entry.player)} (${reasonLabel(entry.reason)})`
      )
      .join(", ")
  }

  const names = pausing
    .map((entry) => playerRefDisplayName(entry.player))
    .join(", ")
  const reason = reasonLabel(first.reason)
  const summary =
    pausing.length === 1
      ? round_pause_uniform_reason({ count: 1, reason })
      : pausing.length === 2
        ? round_pause_uniform_two({ reason })
        : round_pause_uniform_many({ reason })

  return `${names} — ${summary}`
}

/** A round in which every game was cancelled. It can be committed but scores nothing —
 *  worth saying before anyone presses the button. */
export function isRoundWithoutScoring(round: Round): boolean {
  return (
    round.games.length > 0 &&
    round.games.every((game) => game.status === "cancelled")
  )
}

/**
 * Hint below "commit round". When committing is blocked it shows the reason from
 * `commitBlockedReason()` — before the click, not as a message afterwards.
 */
export function commitHint(round: Round): string {
  const blocked = commitBlockedReason(round)
  if (blocked) return translateDomainIssue(blocked)

  if (isRoundWithoutScoring(round)) {
    return round_commit_cancelled_hint()
  }

  return round_commit_final_hint()
}

/**
 * All rating changes of the round, largest movement first.
 *
 * **Sorted by magnitude, not alphabetically and not by rating.** After the commit
 * exactly one question matters: who moved the most? Equal magnitudes fall back to the
 * name so the order stays stable. Cancelled games do not score and never appear.
 */
export function committedRatingChanges(round: Round): Array<RatingChange> {
  return round.games
    .filter((game) => game.status === "finished")
    .flatMap((game) => game.result?.ratingChanges ?? [])
    .toSorted((a, b) => {
      const byMagnitude = Math.abs(b.delta) - Math.abs(a.delta)
      if (byMagnitude !== 0) return byMagnitude

      return a.player.displayName.localeCompare(
        b.player.displayName,
        getLocale()
      )
    })
}

/** Tally of the committed round: "3 games · 12 players · 2 pauses". */
export function committedRoundSummary(round: Round): string {
  const scored = countByStatus(round.games, "finished")
  const cancelled = countByStatus(round.games, "cancelled")
  const pausing = round.pausing.length

  const summary = summary_games_players_pauses({
    games: count_games({ count: scored }),
    players: count_players({ count: scored * PLAYERS_PER_GAME }),
    pauses: count_pauses({ count: pausing }),
  })

  // Only mention it when there is something to mention — otherwise a zero shows up
  // everywhere.
  if (cancelled > 0) {
    return `${summary} · ${history_cancelled_count({ count: cancelled })}`
  }

  return summary
}
