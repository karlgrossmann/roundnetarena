/**
 * Derivations around pool and round.
 *
 * These rules come from the Python backend (`dao.py`) and must hold identically in
 * both places — otherwise the UI shows something other than what the server does.
 */

import { domainIssue } from "./domain-errors"
import type { DomainIssue } from "./domain-errors"
import type { Game, Pool, PoolEntry, Round } from "./types"

/** Players per game: two teams of two. */
export const PLAYERS_PER_GAME = 4

export function playingEntries(pool: Pool): Array<PoolEntry> {
  return pool.entries.filter((entry) => entry.status === "playing")
}

export function pausedEntries(pool: Pool): Array<PoolEntry> {
  return pool.entries.filter((entry) => entry.status === "paused")
}

/** Default number of courts in play: as many as can be fully staffed. */
export function suggestedCourts(playingCount: number): number {
  return Math.floor(playingCount / PLAYERS_PER_GAME)
}

/**
 * How many players must sit out at the chosen court count. Even when everyone could
 * play arithmetically, the remainder of a player count not divisible by four is always
 * left over — hence the maximum of both figures.
 */
export function playersAtRest(playingCount: number, courts: number): number {
  const notOnCourt = playingCount - courts * PLAYERS_PER_GAME
  const remainder = playingCount % PLAYERS_PER_GAME
  return Math.max(notOnCourt, remainder, 0)
}

/** Highest court count that the present players can staff. */
export function maxCourts(playingCount: number): number {
  return Math.max(1, suggestedCourts(playingCount))
}

/** A round needs at least one fully staffed court. */
export function canStartRound(pool: Pool): boolean {
  return playingEntries(pool).length >= PLAYERS_PER_GAME
}

/**
 * A round can only be committed once no game is open. Only then are ratings carried
 * forward for good.
 */
export function canCommitRound(round: Round): boolean {
  return (
    round.status === "active" &&
    round.games.every((game) => game.status !== "open")
  )
}

/** Language-neutral reason for a disabled commit button. */
export function commitBlockedReason(round: Round): DomainIssue | null {
  if (round.status === "committed")
    return domainIssue("round.already_committed")

  const open = countByStatus(round.games, "open")
  if (open === 0) return null

  return domainIssue("round.open_games", { count: open })
}

export function countByStatus(
  games: Array<Game>,
  status: Game["status"]
): number {
  return games.filter((game) => game.status === status).length
}

/** Round progress as the share of finished games (0 to 1). Cancelled games count as
 *  done. */
export function roundProgress(round: Round): number {
  if (round.games.length === 0) return 0
  const done = round.games.filter((game) => game.status !== "open").length
  return done / round.games.length
}

/** A pool counts as stale after three hours untouched. The UI then asks whether it
 *  should be reused. */
export const POOL_STALE_AFTER_MS = 3 * 60 * 60 * 1000

export function isPoolStale(pool: Pool, now: Date = new Date()): boolean {
  return (
    now.getTime() - new Date(pool.updatedAt).getTime() > POOL_STALE_AFTER_MS
  )
}

/** Next status when tapping a pool tile: absent → playing → paused. */
export function nextPoolStatus(
  status: PoolEntry["status"]
): PoolEntry["status"] {
  switch (status) {
    case "absent":
      return "playing"
    case "playing":
      return "paused"
    case "paused":
      return "absent"
  }
}
