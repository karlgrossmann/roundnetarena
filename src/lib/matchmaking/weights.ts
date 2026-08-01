import type { PlayerId } from "../types"
import type { WeightMatrices } from "./cost"

export interface HistoricalMatchup {
  teamA: [PlayerId, PlayerId]
  teamB: [PlayerId, PlayerId]
}

export interface HistoricalRound {
  timestamp: string
  matchups: Array<HistoricalMatchup>
}

export interface WeightOptions {
  decayFactor?: number
  teamWeight?: number
  gameWeight?: number
  now?: string
}

/**
 * Builds the two matrices from an I/O-free round history.
 *
 * Like `WeightMatrixManager._calc_weights()`, rounds older than 24 hours are processed
 * first, then two extra decay steps follow, then the recent rounds. Each round decays
 * exactly once, regardless of how many games it holds.
 */
export function buildWeightMatrices(
  playerIds: Array<PlayerId>,
  history: Array<HistoricalRound>,
  options: WeightOptions = {}
): WeightMatrices {
  const decay = options.decayFactor ?? 0.5
  const teamWeight = options.teamWeight ?? 64
  const gameWeight = options.gameWeight ?? 16
  const now = options.now
    ? new Date(options.now).getTime()
    : new Date().getTime()
  const recentThreshold = 24 * 60 * 60 * 1000
  const indexById = new Map(
    playerIds.map((playerId, index) => [playerId, index])
  )
  const sameTeam = squareMatrix(playerIds.length)
  const sameGame = squareMatrix(playerIds.length)
  const ordered = history.toSorted(
    (first, second) => timestampOf(first) - timestampOf(second)
  )
  const older = ordered.filter(
    (round) => now - timestampOf(round) > recentThreshold
  )
  const recent = ordered.filter(
    (round) => now - timestampOf(round) <= recentThreshold
  )

  older.forEach(registerRound)
  decayWeights()
  decayWeights()
  recent.forEach(registerRound)

  return {
    playerIds,
    sameGame: truncateMatrix(sameGame),
    sameTeam: truncateMatrix(sameTeam),
  }

  function registerRound(round: HistoricalRound): void {
    decayWeights()
    round.matchups.forEach((game) => {
      addPair(game.teamA[0], game.teamA[1], teamWeight, gameWeight)
      addPair(game.teamB[0], game.teamB[1], teamWeight, gameWeight)
      game.teamA.forEach((teamAPlayer) => {
        game.teamB.forEach((teamBPlayer) => {
          addPair(teamAPlayer, teamBPlayer, gameWeight, gameWeight)
        })
      })
    })
  }

  function decayWeights(): void {
    decayMatrix(sameTeam, decay)
    decayMatrix(sameGame, decay)
  }

  function addPair(
    first: PlayerId,
    second: PlayerId,
    teamIncrement: number,
    gameIncrement: number
  ): void {
    const firstIndex = indexById.get(first)
    const secondIndex = indexById.get(second)
    if (firstIndex === undefined || secondIndex === undefined) return

    sameTeam[firstIndex][secondIndex] += teamIncrement
    sameTeam[secondIndex][firstIndex] += teamIncrement
    sameGame[firstIndex][secondIndex] += gameIncrement
    sameGame[secondIndex][firstIndex] += gameIncrement
  }
}

function timestampOf(round: HistoricalRound): number {
  return new Date(round.timestamp).getTime()
}

function squareMatrix(size: number): Array<Array<number>> {
  return Array.from({ length: size }, () => Array<number>(size).fill(0))
}

function decayMatrix(matrix: Array<Array<number>>, factor: number): void {
  matrix.forEach((row) => {
    row.forEach((value, index) => {
      row[index] = value * factor
    })
  })
}

function truncateMatrix(matrix: Array<Array<number>>): Array<Array<number>> {
  return matrix.map((row) => row.map((value) => Math.trunc(value)))
}
