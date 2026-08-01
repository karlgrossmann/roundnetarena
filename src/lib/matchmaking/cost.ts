import { DomainError } from "../domain-errors"
import type { FixedTeam, PlayerId } from "../types"

export interface MatchmakingPlayer {
  id: PlayerId
  rating: number
}

export interface WeightMatrices {
  playerIds: Array<PlayerId>
  sameGame: Array<Array<number>>
  sameTeam: Array<Array<number>>
}

export interface MatchupCost {
  ratingRange: number
  teamDifference: number
  repeatedPlayers: number
  total: number
}

export type Matchup = [PlayerId, PlayerId, PlayerId, PlayerId]

const RATING_RANGE_FACTOR = 0.2
const TEAM_DIFFERENCE_FACTOR = 1
const REPEATED_PLAYERS_FACTOR = 5
const RATING_RANGE_THRESHOLD = 199
const TEAM_DIFFERENCE_THRESHOLD = 23
const REDUCTION_FACTOR = 0.01

export function calculateMatchupCost(
  matchup: Matchup,
  players: Array<MatchmakingPlayer>,
  weights: WeightMatrices,
  higherRatingWeight: number,
  exponent = 2
): MatchupCost {
  const playerById = new Map(players.map((player) => [player.id, player]))
  const indices = matchup.map((playerId) => {
    const index = weights.playerIds.indexOf(playerId)
    if (index < 0) throw new DomainError("matcher.unknown_player")
    return index
  })
  const ratings = matchup.map((playerId) => {
    const player = playerById.get(playerId)
    if (!player) throw new DomainError("matcher.unknown_player")
    return player.rating
  })

  const ratingRange =
    RATING_RANGE_FACTOR *
    reduceBelowThreshold(
      Math.max(...ratings) - Math.min(...ratings),
      RATING_RANGE_THRESHOLD
    ) **
      exponent

  const teamA = weightedTeamRating(ratings[0], ratings[1], higherRatingWeight)
  const teamB = weightedTeamRating(ratings[2], ratings[3], higherRatingWeight)
  const teamDifference =
    TEAM_DIFFERENCE_FACTOR *
    reduceBelowThreshold(Math.abs(teamA - teamB), TEAM_DIFFERENCE_THRESHOLD) **
      exponent

  const [a1, a2, b1, b2] = indices
  const repeatedRaw =
    weights.sameTeam[a1][a2] +
    weights.sameTeam[b1][b2] +
    weights.sameGame[a1][b1] +
    weights.sameGame[a1][b2] +
    weights.sameGame[a2][b1] +
    weights.sameGame[a2][b2]
  const repeatedPlayers = REPEATED_PLAYERS_FACTOR * repeatedRaw ** exponent

  return {
    ratingRange,
    teamDifference,
    repeatedPlayers,
    total: ratingRange + teamDifference + repeatedPlayers,
  }
}

export function bestSplitForFour(
  four: [PlayerId, PlayerId, PlayerId, PlayerId],
  players: Array<MatchmakingPlayer>,
  weights: WeightMatrices,
  higherRatingWeight: number,
  fixedTeams: Array<FixedTeam> = []
): { matchup: Matchup; cost: MatchupCost } {
  const [first, second, third, fourth] = four
  const options: Array<Matchup> = [
    [first, fourth, second, third],
    [first, third, second, fourth],
    [first, second, third, fourth],
  ]
  const fixedPairs = fixedTeams.map((team) => new Set(team.players))
  const valid = options.filter((matchup) =>
    fixedPairs.every(
      (pair) =>
        containsPair(matchup.slice(0, 2), pair) ||
        containsPair(matchup.slice(2), pair)
    )
  )
  if (valid.length === 0) {
    throw new DomainError("matcher.fixed_teams")
  }

  return valid
    .map((matchup) => ({
      matchup,
      cost: calculateMatchupCost(matchup, players, weights, higherRatingWeight),
    }))
    .reduce((best, candidate) =>
      candidate.cost.total < best.cost.total ? candidate : best
    )
}

export function quartetKeepsFixedTeams(
  quartet: ReadonlyArray<PlayerId>,
  fixedTeams: Array<FixedTeam>
): boolean {
  const present = new Set(quartet)
  return fixedTeams.every((team) => {
    const count = team.players.filter((playerId) =>
      present.has(playerId)
    ).length
    return count === 0 || count === 2
  })
}

function containsPair(team: Array<PlayerId>, pair: Set<PlayerId>): boolean {
  return team.length === 2 && team.every((playerId) => pair.has(playerId))
}

function reduceBelowThreshold(value: number, threshold: number): number {
  return value < threshold
    ? value * REDUCTION_FACTOR
    : threshold * REDUCTION_FACTOR + value - threshold
}

function weightedTeamRating(
  first: number,
  second: number,
  higherRatingWeight: number
): number {
  const low = Math.min(first, second)
  const high = Math.max(first, second)
  return (low + high * higherRatingWeight) / (higherRatingWeight + 1)
}
