import { DomainError } from "../domain-errors"
import type { FixedTeam, PauseMode, PlayerId, PlayerRef } from "../types"

export interface PauseStats {
  player: PlayerRef
  gamesPlayedToday: number
  gamesPausedToday: number
}

export interface PauseSelection {
  playing: Array<PlayerRef>
  pausing: Array<PlayerRef>
}

interface PauseUnit {
  players: Array<PlayerRef>
  quota: number
  tieBreaker: number
}

export function pauseQuota(stats: {
  gamesPlayedToday: number
  gamesPausedToday: number
}): number {
  if (stats.gamesPlayedToday === 0) return 1000 + stats.gamesPausedToday
  if (stats.gamesPausedToday === 0) return 1 / (stats.gamesPlayedToday + 5)
  return stats.gamesPausedToday / stats.gamesPlayedToday
}

/** Picks the players or fixed pairs with the lowest pause quota so far. */
export function selectPlayersToPause(
  candidates: Array<PauseStats>,
  numberToPause: number,
  mode: PauseMode,
  fixedTeams: Array<FixedTeam> = [],
  random: () => number = Math.random
): PauseSelection {
  if (numberToPause <= 0) {
    return { playing: candidates.map(({ player }) => player), pausing: [] }
  }

  const statsById = new Map(
    candidates.map((candidate) => [candidate.player.id, candidate])
  )
  const teamPlayerIds = new Set(fixedTeams.flatMap((team) => team.players))
  const units: Array<PauseUnit> = []

  fixedTeams.forEach((team) => {
    const teamStats = team.players
      .map((playerId) => statsById.get(playerId))
      .filter((stats): stats is PauseStats => stats !== undefined)
    if (teamStats.length !== 2) return
    units.push(toUnit(teamStats))
  })
  candidates
    .filter(({ player }) => !teamPlayerIds.has(player.id))
    .forEach((candidate) => units.push(toUnit([candidate])))

  const ordered = units.toSorted(
    (first, second) =>
      first.quota - second.quota ||
      first.tieBreaker - second.tieBreaker ||
      random() - 0.5
  )
  const pausedIds = new Set<PlayerId>()
  let remaining = numberToPause
  ordered.forEach((unit) => {
    if (unit.players.length > remaining) return
    unit.players.forEach((player) => pausedIds.add(player.id))
    remaining -= unit.players.length
  })

  if (remaining !== 0) {
    throw new DomainError("pause.count_unfulfillable")
  }

  return {
    playing: candidates
      .filter(({ player }) => !pausedIds.has(player.id))
      .map(({ player }) => player),
    pausing: candidates
      .filter(({ player }) => pausedIds.has(player.id))
      .map(({ player }) => player),
  }

  function toUnit(stats: Array<PauseStats>): PauseUnit {
    return {
      players: stats.map(({ player }) => player),
      quota:
        stats.reduce((sum, value) => sum + pauseQuota(value), 0) / stats.length,
      tieBreaker:
        mode === "lowest_first"
          ? stats.reduce((sum, value) => sum + value.player.rating, 0) /
            stats.length
          : random() * 100,
    }
  }
}
