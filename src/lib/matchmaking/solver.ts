import { DomainError } from "../domain-errors"
import type { FixedTeam, PlayerId } from "../types"
import {
  bestSplitForFour,
  calculateMatchupCost,
  quartetKeepsFixedTeams,
} from "./cost"
import type { MatchmakingPlayer, Matchup, WeightMatrices } from "./cost"

export interface SolveMatchingInput {
  players: Array<MatchmakingPlayer>
  weights: WeightMatrices
  higherRatingWeight: number
  fixedTeams?: Array<FixedTeam>
  /** Overrides the exact time limit and disables the automatic retry. */
  timeLimitSeconds?: number
}

export interface MatchingSolution {
  matchups: Array<Matchup>
  cost: number
}

const DEFAULT_TIME_LIMIT_SECONDS = 20
const RETRY_TIME_LIMIT_SECONDS = 60

/**
 * Set partitioning like `BruteforceMatcher`: one binary variable per combination of
 * four, with every player in exactly one chosen quartet.
 */
export async function solveMatching(
  input: SolveMatchingInput
): Promise<MatchingSolution> {
  if (input.players.length === 0 || input.players.length % 4 !== 0) {
    throw new DomainError("matcher.player_count")
  }

  const fixedTeams = input.fixedTeams ?? []
  const ids = input.players.map((player) => player.id)
  const candidates = combinationsOfFour(ids)
    .filter((quartet) => quartetKeepsFixedTeams(quartet, fixedTeams))
    .map((quartet) => {
      const best = bestSplitForFour(
        quartet,
        input.players,
        input.weights,
        input.higherRatingWeight,
        fixedTeams.filter((team) =>
          team.players.every((playerId) => quartet.includes(playerId))
        )
      )
      return {
        matchup: best.matchup,
        playerIds: quartet,
        cost: best.cost.total,
      }
    })

  if (candidates.length === 0) {
    throw new DomainError("matcher.no_valid_assignment")
  }
  if (input.players.length === 4) {
    return { matchups: [candidates[0].matchup], cost: candidates[0].cost }
  }

  const { default: createGlpk } = await import("glpk.js/node")
  const glpk = await createGlpk()
  const variableNames = candidates.map((_, index) => `x${index}`)
  const model = {
    name: "roundnet_matchmaking",
    objective: {
      direction: glpk.GLP_MIN,
      name: "cost",
      vars: candidates.map((candidate, index) => ({
        name: variableNames[index],
        coef: candidate.cost,
      })),
    },
    subjectTo: ids.map((playerId) => ({
      name: `player_${playerId}`,
      vars: candidates.flatMap((candidate, index) =>
        candidate.playerIds.includes(playerId)
          ? [{ name: variableNames[index], coef: 1 }]
          : []
      ),
      bnds: { type: glpk.GLP_FX, lb: 1, ub: 1 },
    })),
    binaries: variableNames,
  }
  const solveExactly = (timeLimitSeconds: number) =>
    glpk.solve(model, {
      mipgap: 0,
      tmlim: timeLimitSeconds,
      msglev: glpk.GLP_MSG_ERR,
      presol: true,
    })

  let result = solveExactly(
    input.timeLimitSeconds ?? DEFAULT_TIME_LIMIT_SECONDS
  )
  if (
    input.timeLimitSeconds === undefined &&
    (result.result.status === glpk.GLP_FEAS ||
      result.result.status === glpk.GLP_UNDEF)
  ) {
    result = solveExactly(RETRY_TIME_LIMIT_SECONDS)
  }

  if (result.result.status === glpk.GLP_FEAS) {
    throw new DomainError("matcher.optimality_timeout")
  }
  if (result.result.status !== glpk.GLP_OPT) {
    throw new DomainError("matcher.no_solution")
  }

  const selected = candidates.filter(
    (_, index) => (result.result.vars[variableNames[index]] ?? 0) > 0.5
  )
  return {
    matchups: selected.map((candidate) => candidate.matchup),
    cost: selected.reduce((sum, candidate) => sum + candidate.cost, 0),
  }
}

export interface RandomMatchingInput {
  players: Array<MatchmakingPlayer>
  weights: WeightMatrices
  higherRatingWeight: number
  fixedTeams?: Array<FixedTeam>
  tries?: number
  random?: () => number
}

/**
 * Matches `RandomMatcher(tries=3)`: three random lineups are scored with the quadratic
 * total cost function, and the cheapest one is kept.
 */
export function randomMatching(input: RandomMatchingInput): MatchingSolution {
  const tries = input.tries ?? 3
  if (tries < 1 || !Number.isInteger(tries)) {
    throw new DomainError("matcher.attempts")
  }
  const random = input.random ?? Math.random
  const candidates = Array.from({ length: tries }, () => {
    const matchups = randomCandidate(
      input.players,
      input.fixedTeams ?? [],
      random
    )
    const cost = matchups.reduce(
      (sum, matchup) =>
        sum +
        calculateMatchupCost(
          matchup,
          input.players,
          input.weights,
          input.higherRatingWeight
        ).total,
      0
    )
    return { matchups, cost }
  })

  return candidates.reduce((best, candidate) =>
    candidate.cost < best.cost ? candidate : best
  )
}

function randomCandidate(
  players: Array<MatchmakingPlayer>,
  fixedTeams: Array<FixedTeam>,
  random: () => number
): Array<Matchup> {
  const fixedPlayerIds = new Set(fixedTeams.flatMap((team) => team.players))
  const units: Array<Array<PlayerId>> = [
    ...fixedTeams.map((team) => [...team.players]),
    ...players
      .filter((player) => !fixedPlayerIds.has(player.id))
      .map((player) => [player.id]),
  ]
  const shuffledUnits = shuffled(units, random)
  const teams: Array<[PlayerId, PlayerId]> = []
  let pendingSingle: PlayerId | undefined
  shuffledUnits.forEach((unit) => {
    if (unit.length === 2) {
      teams.push([unit[0], unit[1]])
      return
    }
    if (pendingSingle) {
      teams.push([pendingSingle, unit[0]])
      pendingSingle = undefined
    } else {
      pendingSingle = unit[0]
    }
  })
  if (pendingSingle) {
    throw new DomainError("matcher.teams")
  }
  const shuffledTeams = shuffled(teams, random)

  return Array.from(
    { length: shuffledTeams.length / 2 },
    (_, index) =>
      [...shuffledTeams[index * 2], ...shuffledTeams[index * 2 + 1]] as Matchup
  )
}

function shuffled<T>(values: Array<T>, random: () => number): Array<T> {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = result[index]
    result[index] = result[swapIndex]
    result[swapIndex] = current
  }
  return result
}

function combinationsOfFour(
  values: Array<PlayerId>
): Array<[PlayerId, PlayerId, PlayerId, PlayerId]> {
  const result: Array<[PlayerId, PlayerId, PlayerId, PlayerId]> = []
  for (let first = 0; first < values.length - 3; first += 1) {
    for (let second = first + 1; second < values.length - 2; second += 1) {
      for (let third = second + 1; third < values.length - 1; third += 1) {
        for (let fourth = third + 1; fourth < values.length; fourth += 1) {
          result.push([
            values[first],
            values[second],
            values[third],
            values[fourth],
          ])
        }
      }
    }
  }
  return result
}
