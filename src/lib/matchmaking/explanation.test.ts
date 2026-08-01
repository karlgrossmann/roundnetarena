import { describe, expect, it } from "vitest"

import {
  generateMatchExplanation,
  supportsMatchExplanation,
} from "./explanation"
import { solveMatching } from "./solver"
import type { MatchmakingPlayer, WeightMatrices } from "./cost"
import type { FixedTeam } from "../types"

const players: Array<MatchmakingPlayer> = Array.from(
  { length: 8 },
  (_, index) => ({
    id: `p${index + 1}`,
    rating: 1900 - index * 90,
  })
)

function variedWeights(): WeightMatrices {
  const sameTeam = Array.from({ length: players.length }, () =>
    Array<number>(players.length).fill(0)
  )
  const sameGame = Array.from({ length: players.length }, () =>
    Array<number>(players.length).fill(0)
  )
  for (let first = 0; first < players.length; first += 1) {
    for (let second = first + 1; second < players.length; second += 1) {
      const teamWeight = ((first * 7 + second * 3) % 5) * 4
      const gameWeight = ((first * 5 + second * 11) % 6) * 2
      sameTeam[first][second] = teamWeight
      sameTeam[second][first] = teamWeight
      sameGame[first][second] = gameWeight
      sameGame[second][first] = gameWeight
    }
  }
  return {
    playerIds: players.map((player) => player.id),
    sameTeam,
    sameGame,
  }
}

describe("structured matcher explanation", () => {
  it("supports only the exact default matcher", () => {
    expect(supportsMatchExplanation("default")).toBe(true)
    expect(supportsMatchExplanation("random")).toBe(false)
  })

  it("produces reproducible, arithmetically consistent counterfactuals", async () => {
    const weights = variedWeights()
    const solution = await solveMatching({
      players,
      weights,
      higherRatingWeight: 2,
    })
    const input = {
      matchups: solution.matchups,
      players,
      weights,
      higherRatingWeight: 2,
    }

    const explanation = generateMatchExplanation(input)

    expect(generateMatchExplanation(input)).toEqual(explanation)
    expect(explanation.matcher).toBe("default")
    expect(explanation.chosen.cost).toBeCloseTo(solution.cost, 8)
    expect(explanation.alternatives.length).toBeGreaterThan(0)
    explanation.alternatives.forEach((alternative) => {
      expect(alternative.cost).toBeGreaterThanOrEqual(explanation.chosen.cost)
      expect(alternative.costDelta).toBeCloseTo(
        alternative.cost - explanation.chosen.cost,
        10
      )
      expect(new Set(playersIn(alternative.matchups))).toEqual(
        new Set(players.map((player) => player.id))
      )
    })
  })

  it("keeps fixed teams intact and leaves pausing players out of alternatives", async () => {
    const fixedTeams: Array<FixedTeam> = [
      { id: "fixed-p1-p2", players: ["p1", "p2"] },
    ]
    const weights = variedWeights()
    const solution = await solveMatching({
      players,
      weights,
      higherRatingWeight: 2,
      fixedTeams,
    })

    const explanation = generateMatchExplanation({
      matchups: solution.matchups,
      players,
      weights,
      higherRatingWeight: 2,
      fixedTeams,
    })

    expect(explanation.alternatives.length).toBeGreaterThan(0)
    for (const lineup of [explanation.chosen, ...explanation.alternatives]) {
      expect(playersIn(lineup.matchups)).not.toContain("paused-player")
      expect(
        lineup.matchups.some(
          (matchup) =>
            matchup.teamA.includes("p1") && matchup.teamA.includes("p2")
        ) ||
          lineup.matchups.some(
            (matchup) =>
              matchup.teamB.includes("p1") && matchup.teamB.includes("p2")
          )
      ).toBe(true)
    }
  })
})

function playersIn(
  matchups: Array<{
    teamA: [string, string]
    teamB: [string, string]
  }>
): Array<string> {
  return matchups.flatMap((matchup) => [...matchup.teamA, ...matchup.teamB])
}
