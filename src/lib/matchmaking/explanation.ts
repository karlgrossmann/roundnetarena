import {
  bestSplitForFour,
  calculateMatchupCost,
  quartetKeepsFixedTeams,
} from "./cost"
import type { MatchmakingPlayer, Matchup, WeightMatrices } from "./cost"
import { DomainError } from "../domain-errors"
import type {
  FixedTeam,
  MatchExplanation,
  MatchExplanationCriterion,
  MatchingAlgorithm,
} from "../types"

export interface GenerateMatchExplanationInput {
  matchups: Array<Matchup>
  players: Array<MatchmakingPlayer>
  weights: WeightMatrices
  higherRatingWeight: number
  fixedTeams?: Array<FixedTeam>
}

const CRITERIA: Array<MatchExplanationCriterion> = [
  "ratingRange",
  "teamDifference",
  "repeatedPlayers",
]

export function supportsMatchExplanation(
  algorithm: MatchingAlgorithm
): algorithm is "default" {
  return algorithm === "default"
}

/**
 * Port of the computation in `explanations.py:generate_counterfactuals`.
 *
 * For each relevant cost component the most expensive chosen matchup is located. All
 * single-swap counterfactuals are then evaluated, and the cheapest overall variant is
 * kept that lowers the component noticeably without undercutting the proven optimum.
 */
export function generateMatchExplanation(
  input: GenerateMatchExplanationInput
): MatchExplanation {
  if (input.matchups.length === 0) {
    throw new DomainError("matcher.explanation_empty")
  }

  const fixedTeams = input.fixedTeams ?? []
  const chosenCost = totalCost(input.matchups, input)
  const matchupCosts = input.matchups.map((matchup) =>
    calculateMatchupCost(
      matchup,
      input.players,
      input.weights,
      input.higherRatingWeight
    )
  )
  const meanMatchupCost =
    matchupCosts.reduce((sum, cost) => sum + cost.total, 0) /
    matchupCosts.length
  const normalizationFactor = meanMatchupCost / 3 || 1

  const alternatives = CRITERIA.flatMap((criterion) => {
    const highestCost = Math.max(...matchupCosts.map((cost) => cost[criterion]))
    if (highestCost === 0 || highestCost / normalizationFactor <= 0.6) {
      return []
    }

    const targetMatchupIndex = matchupCosts.findIndex(
      (cost) => cost[criterion] === highestCost
    )
    const alternative = bestCounterfactual(
      input,
      fixedTeams,
      criterion,
      targetMatchupIndex,
      highestCost,
      normalizationFactor,
      chosenCost
    )
    return alternative
      ? [
          {
            id: criterion,
            matchups: toStructuredMatchups(alternative.matchups),
            cost: alternative.cost,
            costDelta: alternative.cost - chosenCost,
          },
        ]
      : []
  })

  return {
    version: 1,
    matcher: "default",
    chosen: {
      id: "chosen",
      matchups: toStructuredMatchups(input.matchups),
      cost: chosenCost,
    },
    alternatives,
  }
}

interface Counterfactual {
  matchups: Array<Matchup>
  cost: number
  criterionCost: number
}

function bestCounterfactual(
  input: GenerateMatchExplanationInput,
  fixedTeams: Array<FixedTeam>,
  criterion: MatchExplanationCriterion,
  targetMatchupIndex: number,
  highestCost: number,
  normalizationFactor: number,
  chosenCost: number
): Counterfactual | undefined {
  const flattened = input.matchups.flat()
  const candidates: Array<Counterfactual> = []

  for (let first = 0; first < flattened.length - 1; first += 1) {
    for (let second = first + 1; second < flattened.length; second += 1) {
      const swapped = [...flattened]
      ;[swapped[first], swapped[second]] = [swapped[second], swapped[first]]
      const quartets = toMatchups(swapped)
      if (
        quartets.some((quartet) => !quartetKeepsFixedTeams(quartet, fixedTeams))
      ) {
        continue
      }

      const affected = new Set([Math.floor(first / 4), Math.floor(second / 4)])
      const optimized = quartets.map((quartet, index) => {
        if (!affected.has(index)) return quartet
        return bestSplitForFour(
          quartet,
          input.players,
          input.weights,
          input.higherRatingWeight,
          fixedTeams.filter((team) =>
            team.players.every((playerId) => quartet.includes(playerId))
          )
        ).matchup
      })
      const targetCost = calculateMatchupCost(
        optimized[targetMatchupIndex],
        input.players,
        input.weights,
        input.higherRatingWeight
      )[criterion]
      const requiredReduction = Math.max(
        0.2 * highestCost,
        (0.33 * highestCost) / normalizationFactor
      )
      if (targetCost >= highestCost - requiredReduction) continue

      const candidateCost = totalCost(optimized, input)
      if (candidateCost < chosenCost) continue
      candidates.push({
        matchups: optimized,
        cost: candidateCost,
        criterionCost: targetCost,
      })
    }
  }

  return candidates.toSorted(compareCounterfactuals)[0]
}

function compareCounterfactuals(
  first: Counterfactual,
  second: Counterfactual
): number {
  return (
    first.cost - second.cost ||
    first.criterionCost - second.criterionCost ||
    lineupKey(first.matchups).localeCompare(lineupKey(second.matchups))
  )
}

function totalCost(
  matchups: Array<Matchup>,
  input: GenerateMatchExplanationInput
): number {
  return matchups.reduce(
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
}

function toMatchups(values: Array<string>): Array<Matchup> {
  return Array.from(
    { length: values.length / 4 },
    (_, index) => values.slice(index * 4, index * 4 + 4) as Matchup
  )
}

function toStructuredMatchups(
  matchups: Array<Matchup>
): MatchExplanation["chosen"]["matchups"] {
  return matchups.map(([a1, a2, b1, b2]) => ({
    teamA: [a1, a2],
    teamB: [b1, b2],
  }))
}

function lineupKey(matchups: Array<Matchup>): string {
  return matchups.flat().join("\u0000")
}
