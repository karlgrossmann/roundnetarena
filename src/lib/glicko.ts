/**
 * Glicko-2 for roundnet doubles.
 *
 * Ported from `automatic_matchmaking/glicko2/glicko2.py` and
 * `automatic_matchmaking/algo_glicko2.py`. The team rating is only used during the
 * calculation; afterwards every player gets their individual difference back.
 */

import { DomainError } from "./domain-errors"

const SCALE = 173.7178
const BASE_RATING = 1500
const TAU = 0.5
const CONVERGENCE = 0.000001

export interface GlickoRating {
  playerId: string
  rating: number
  rd: number
  vol: number
  timestamp: string
}

export interface DoublesRatingInput {
  teamA: [GlickoRating, GlickoRating]
  teamB: [GlickoRating, GlickoRating]
  pointsA: number
  pointsB: number
  timestamp: string
  matchImportance?: number
  useMatchImportanceFactor?: boolean
}

interface MutableRating {
  playerId: string
  rating: number
  rd: number
  vol: number
  teamRatingDifference: number
}

/** Python rule: RD grows week by week, rounding up from five leftover days on. */
export function timeAdjustedRd(
  oldRd: number,
  previousTimestamp: string,
  timestamp: string,
  maxRd = 155,
  increment = 25,
  maxIncrease = 100
): number {
  if (oldRd > maxRd) return oldRd

  const elapsedMs = Math.max(
    new Date(timestamp).getTime() - new Date(previousTimestamp).getTime(),
    0
  )
  const elapsedDays = Math.floor(elapsedMs / (24 * 60 * 60 * 1000))
  let weeks = Math.floor(elapsedDays / 7)
  if (elapsedDays % 7 >= 5) weeks += 1

  let rd = oldRd
  for (let week = 0; week < weeks; week += 1) {
    rd = Math.min(Math.sqrt(rd ** 2 + increment ** 2), maxRd)
  }

  return Math.min(maxRd, oldRd + Math.min(maxIncrease, rd - oldRd))
}

export function rateDoublesGame(
  input: DoublesRatingInput
): Array<GlickoRating> {
  if (
    input.pointsA < 0 ||
    input.pointsB < 0 ||
    input.pointsA === input.pointsB
  ) {
    throw new DomainError("glicko.invalid_score")
  }

  const playersA = input.teamA.map((rating) =>
    mutableRating(rating, input.timestamp)
  ) as [MutableRating, MutableRating]
  const playersB = input.teamB.map((rating) =>
    mutableRating(rating, input.timestamp)
  ) as [MutableRating, MutableRating]

  const teamARating = mean(playersA.map((player) => player.rating))
  const teamBRating = mean(playersB.map((player) => player.rating))
  const teamARd = mean(playersA.map((player) => player.rd))
  const teamBRd = mean(playersB.map((player) => player.rd))
  const useFactor = input.useMatchImportanceFactor ?? true
  const importance = input.matchImportance ?? 1.5
  const importanceA =
    importance *
    matchImportanceFactor(
      Math.abs(playersA[0].rating - playersA[1].rating),
      useFactor
    )
  const importanceB =
    importance *
    matchImportanceFactor(
      Math.abs(playersB[0].rating - playersB[1].rating),
      useFactor
    )
  const [outcomeA, outcomeB] = softenedResult(input.pointsA, input.pointsB)

  playersA.forEach((player) => setToTeamRating(player, teamARating))
  playersB.forEach((player) => setToTeamRating(player, teamBRating))

  playersA.forEach((player) =>
    updatePlayer(player, teamBRating, teamBRd, outcomeA, importanceA)
  )
  playersB.forEach((player) =>
    updatePlayer(player, teamARating, teamARd, outcomeB, importanceB)
  )

  return [...playersA, ...playersB].map((player) => {
    player.rating += player.teamRatingDifference
    player.rating = applyRubberband(player.rating)

    return {
      playerId: player.playerId,
      rating: Math.round(player.rating),
      rd: player.rd,
      vol: player.vol,
      timestamp: input.timestamp,
    }
  })
}

export function predictDoublesOutcome(
  teamA: [GlickoRating, GlickoRating],
  teamB: [GlickoRating, GlickoRating]
): number {
  const ratingA = mean(teamA.map((rating) => rating.rating))
  const ratingB = mean(teamB.map((rating) => rating.rating))
  const rdB = mean(teamB.map((rating) => rating.rd))
  return expected(
    toInternalRating(ratingA),
    toInternalRating(ratingB),
    rdB / SCALE
  )
}

function mutableRating(rating: GlickoRating, timestamp: string): MutableRating {
  return {
    playerId: rating.playerId,
    rating: rating.rating,
    rd: timeAdjustedRd(rating.rd, rating.timestamp, timestamp),
    vol: rating.vol,
    teamRatingDifference: 0,
  }
}

function setToTeamRating(player: MutableRating, teamRating: number): void {
  player.teamRatingDifference = player.rating - teamRating
  player.rating = teamRating
}

function updatePlayer(
  player: MutableRating,
  opponentRating: number,
  opponentRd: number,
  outcome: number,
  importance: number
): void {
  let rating = toInternalRating(player.rating)
  let rd = player.rd / SCALE
  const opponent = toInternalRating(opponentRating)
  const opponentDeviation = opponentRd / SCALE
  const variance = ratingVariance(rating, opponent, opponentDeviation)
  const delta = ratingDelta(
    rating,
    opponent,
    opponentDeviation,
    outcome,
    variance
  )

  player.vol = newVolatility(rating, rd, player.vol, delta, variance)
  rd = Math.sqrt(rd ** 2 + player.vol ** 2)
  rd = 1 / Math.sqrt(1 / rd ** 2 + 1 / variance)
  rating +=
    rd ** 2 *
    g(opponentDeviation) *
    (outcome - expected(rating, opponent, opponentDeviation)) *
    importance

  player.rating = rating * SCALE + BASE_RATING
  player.rd = rd * SCALE
}

function newVolatility(
  rating: number,
  rd: number,
  volatility: number,
  delta: number,
  variance: number
): number {
  const a = Math.log(volatility ** 2)
  let lower = a
  let upper: number

  if (delta ** 2 > rd ** 2 + variance) {
    upper = Math.log(delta ** 2 - rd ** 2 - variance)
  } else {
    let k = 1
    while (
      volatilityFunction(
        a - k * Math.sqrt(TAU ** 2),
        rating,
        delta,
        variance,
        a
      ) < 0
    ) {
      k += 1
    }
    upper = a - k * Math.sqrt(TAU ** 2)
  }

  let fLower = volatilityFunction(lower, rating, delta, variance, a)
  let fUpper = volatilityFunction(upper, rating, delta, variance, a)
  while (Math.abs(upper - lower) > CONVERGENCE) {
    const candidate = lower + ((lower - upper) * fLower) / (fUpper - fLower)
    const fCandidate = volatilityFunction(candidate, rating, delta, variance, a)
    if (fCandidate * fUpper < 0) {
      lower = upper
      fLower = fUpper
    } else {
      fLower /= 2
    }
    upper = candidate
    fUpper = fCandidate
  }

  return Math.exp(lower / 2)
}

/**
 * Deliberately matches the Python reference: it uses the internal rating here instead
 * of the RD. That deviates from the Glicko paper, but it is part of the existing
 * scoring being ported and is pinned down by the golden tests.
 */
function volatilityFunction(
  value: number,
  rating: number,
  delta: number,
  variance: number,
  a: number
): number {
  const exponential = Math.exp(value)
  const numerator =
    exponential * (delta ** 2 - rating ** 2 - variance - exponential)
  const denominator = 2 * (rating ** 2 + variance + exponential) ** 2
  return numerator / denominator - (value - a) / TAU ** 2
}

function ratingVariance(
  rating: number,
  opponent: number,
  opponentRd: number
): number {
  const estimate = expected(rating, opponent, opponentRd)
  return 1 / (g(opponentRd) ** 2 * estimate * (1 - estimate))
}

function ratingDelta(
  rating: number,
  opponent: number,
  opponentRd: number,
  outcome: number,
  variance: number
): number {
  return (
    variance *
    g(opponentRd) *
    (outcome - expected(rating, opponent, opponentRd))
  )
}

function expected(
  rating: number,
  opponent: number,
  opponentRd: number
): number {
  return 1 / (1 + Math.exp(-g(opponentRd) * (rating - opponent)))
}

function g(rd: number): number {
  return 1 / Math.sqrt(1 + (3 * rd ** 2) / Math.PI ** 2)
}

function softenedResult(pointsA: number, pointsB: number): [number, number] {
  const ratio = Math.min(pointsA, pointsB) / Math.max(pointsA, pointsB)
  const courtesy = 0.5 * sigmoid(6.5 * ratio - 4.5)
  return pointsA > pointsB ? [1 - courtesy, courtesy] : [courtesy, 1 - courtesy]
}

function matchImportanceFactor(ratingDifference: number, enabled: boolean) {
  if (!enabled) return 1
  return 1 - 0.5 * sigmoid(0.02 * (ratingDifference - 200))
}

function applyRubberband(rating: number): number {
  if (rating > 1700) {
    const overshoot = rating - 1700
    return rating - (overshoot / 100) ** 2
  }
  if (rating < 1300) {
    const undershoot = 1300 - rating
    return rating + (undershoot / 100) ** 2
  }
  return rating
}

function sigmoid(value: number): number {
  return 1 / (1 + Math.exp(-value))
}

function toInternalRating(rating: number): number {
  return (rating - BASE_RATING) / SCALE
}

function mean(values: Array<number>): number {
  return values.reduce((total, value) => total + value, 0) / values.length
}
