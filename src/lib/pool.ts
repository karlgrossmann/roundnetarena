/**
 * Derivations for the pool view: ordering, counts, labels and the immutable pool
 * updates.
 *
 * Complements `round.ts`: that file holds the rules the backend knows as well (court
 * count, players at rest, start condition), this one everything only the UI needs. The
 * pool is never mutated — every function returns a new pool.
 */

import {
  PLAYERS_PER_GAME,
  maxCourts,
  playersAtRest,
  suggestedCourts,
} from "./round"
import { getLocale } from "@/paraglide/runtime.js"
import {
  count_games,
  count_players,
  pool_consequence,
  pool_count_paused,
  pool_count_playing,
  pool_count_resting,
  pool_minimum_players,
  pool_no_pause,
  pool_round_hint,
  pool_summary,
} from "@/paraglide/messages.js"
import type {
  FixedTeam,
  IsoDateTime,
  PauseCandidate,
  Player,
  PlayerRef,
  Pool,
  PoolEntry,
  PoolStatus,
} from "./types"

export interface PoolCounts {
  playing: number
  paused: number
  absent: number
}

/**
 * Every league player with their pool status.
 *
 * The grid deliberately also shows those who are not here today — otherwise there
 * would be no way to add someone later. Anyone missing from the pool counts as absent.
 */
export function poolEntriesForPlayers(
  players: Array<Player>,
  pool: Pool
): Array<PoolEntry> {
  const statusById = new Map(
    pool.entries.map((entry) => [entry.player.id, entry.status])
  )

  return players.map((player) => ({
    player: {
      id: player.id,
      displayName: player.displayName,
      rating: player.rating,
    },
    status: statusById.get(player.id) ?? "absent",
  }))
}

/**
 * Grid order: alphabetical by display name — **independent of status**.
 *
 * Sorting by status would make every tile jump elsewhere on tap, but the pool is
 * tapped through in one go: having to search again after each tap leads to mistaps.
 * The order is therefore fixed, and status shows only on the tile itself.
 */
export function sortPoolEntries(entries: Array<PoolEntry>): Array<PoolEntry> {
  return entries.toSorted((a, b) =>
    a.player.displayName.localeCompare(b.player.displayName, getLocale())
  )
}

export function countPoolStatus(entries: Array<PoolEntry>): PoolCounts {
  return {
    playing: entries.filter((entry) => entry.status === "playing").length,
    paused: entries.filter((entry) => entry.status === "paused").length,
    absent: entries.filter((entry) => entry.status === "absent").length,
  }
}

/**
 * Sets a player's status. Anyone not yet in the pool is added — that way a guest who
 * was just created lands in the pool directly.
 */
export function poolWithStatus(
  pool: Pool,
  player: PlayerRef,
  status: PoolStatus,
  now: IsoDateTime
): Pool {
  const known = pool.entries.some((entry) => entry.player.id === player.id)

  return {
    updatedAt: now,
    fixedTeams: pool.fixedTeams,
    entries: known
      ? pool.entries.map((entry) =>
          entry.player.id === player.id ? { ...entry, status } : entry
        )
      : [...pool.entries, { player, status }],
  }
}

/**
 * "Add everyone": every absent player joins in.
 *
 * Anyone set to `paused` stays paused — they are already here and deliberately chose a
 * break, which a bulk action must not overwrite.
 */
export function poolWithAllPlaying(
  pool: Pool,
  players: Array<Player>,
  now: IsoDateTime
): Pool {
  return {
    updatedAt: now,
    fixedTeams: pool.fixedTeams,
    entries: poolEntriesForPlayers(players, pool).map((entry) =>
      entry.status === "absent" ? { ...entry, status: "playing" } : entry
    ),
  }
}

/** "Clear pool": nobody is here anymore. The tiles stay visible because they come from
 *  the player list, not from the pool. */
export function clearedPool(now: IsoDateTime): Pool {
  return { updatedAt: now, entries: [], fixedTeams: [] }
}

/** Pairs two players, releasing both from any other fixed team first. */
export function withFixedTeam(
  pool: Pool,
  first: PlayerRef,
  second: PlayerRef,
  now: IsoDateTime
): Pool {
  if (first.id === second.id) return pool

  const playerIds = new Set([first.id, second.id])
  const players = [first.id, second.id].toSorted()
  const team: FixedTeam = {
    id: `fixed_team_${players.join("_")}`,
    players: [players[0], players[1]],
  }

  return {
    ...pool,
    updatedAt: now,
    fixedTeams: [
      ...pool.fixedTeams.filter((candidate) =>
        candidate.players.every((playerId) => !playerIds.has(playerId))
      ),
      team,
    ],
  }
}

export function withoutFixedTeam(
  pool: Pool,
  teamId: string,
  now: IsoDateTime
): Pool {
  return {
    ...pool,
    updatedAt: now,
    fixedTeams: pool.fixedTeams.filter((team) => team.id !== teamId),
  }
}

/** Only teams whose both members are actively playing in the pool. */
export function activeFixedTeams(pool: Pool): Array<FixedTeam> {
  const playingIds = new Set(
    pool.entries
      .filter((entry) => entry.status === "playing")
      .map((entry) => entry.player.id)
  )

  return pool.fixedTeams.filter((team) =>
    team.players.every((playerId) => playingIds.has(playerId))
  )
}

/** At most two fixed pairs can be prescribed per court. */
export function maxFixedTeams(courts: number): number {
  return Math.max(courts, 0) * 2
}

/**
 * The court count that actually applies.
 *
 * `chosen` is `null` as long as nobody touched the stepper — then the suggestion
 * applies and grows with the pool. An explicit choice is kept but clamped to what can
 * be staffed: once someone leaves, the old number may no longer be fillable.
 */
export function effectiveCourts(
  chosen: number | null,
  playingCount: number
): number {
  const wanted = chosen ?? suggestedCourts(playingCount)
  return Math.min(Math.max(wanted, 1), maxCourts(playingCount))
}

/** Subtitle of the pool card: "12 playing · 2 pausing". */
export function poolSummaryLabel(counts: PoolCounts): string {
  return pool_summary({
    playing: pool_count_playing({ count: counts.playing }),
    paused: pool_count_paused({ count: counts.paused }),
  })
}

/** Consequence of the chosen court count in plain words: "12 playing · 0 at rest". */
export function courtsConsequenceLabel(
  playingCount: number,
  courts: number
): string {
  const atRest = playersAtRest(playingCount, courts)
  return pool_consequence({
    playing: pool_count_playing({ count: playingCount }),
    resting: pool_count_resting({ count: atRest }),
  })
}

/**
 * Explanation below "generate round" — the reason when the action is blocked, and
 * otherwise what a tap will produce.
 */
export function generateRoundHint(
  playingCount: number,
  courts: number
): string {
  if (playingCount < PLAYERS_PER_GAME) {
    return pool_minimum_players({ current: playingCount })
  }

  return pool_round_hint({
    games: count_games({ count: courts }),
    players: count_players({ count: playingCount }),
  })
}

/** A sentence instead of a table when nobody sits out at the chosen court count. */
export function noPauseSentence(playingCount: number, courts: number): string {
  return pool_no_pause({
    courts,
    players: playingCount,
  })
}

/**
 * Preview order: whoever has paused least is on top and sits out next.
 *
 * Sorted explicitly rather than trusting the response order — the table would silently
 * be wrong as soon as the API returns something else.
 */
export function sortPauseCandidates(
  candidates: Array<PauseCandidate>
): Array<PauseCandidate> {
  return candidates.toSorted((a, b) => {
    const byQuota = a.pauseQuota - b.pauseQuota
    if (byQuota !== 0) return byQuota

    return a.player.displayName.localeCompare(b.player.displayName, getLocale())
  })
}

/**
 * Index before which the divider between resting and playing runs — `null` when
 * nobody or everybody sits out. Expects a list already ordered by
 * `sortPauseCandidates()`.
 */
export function pauseBoundaryIndex(
  candidates: Array<PauseCandidate>
): number | null {
  const first = candidates.findIndex((candidate) => !candidate.willPause)
  if (first <= 0) return null

  return first
}
