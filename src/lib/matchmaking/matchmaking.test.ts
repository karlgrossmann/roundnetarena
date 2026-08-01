import { describe, expect, it } from "vitest"

import { activeFixedTeams } from "../pool"
import { bestSplitForFour } from "./cost"
import { pauseQuota, selectPlayersToPause } from "./pause"
import { randomMatching, solveMatching } from "./solver"
import { buildWeightMatrices } from "./weights"
import type { MatchmakingPlayer } from "./cost"
import type { FixedTeam, PlayerRef, Pool } from "../types"

const players: Array<MatchmakingPlayer> = [
  { id: "p1", rating: 1700 },
  { id: "p2", rating: 1600 },
  { id: "p3", rating: 1400 },
  { id: "p4", rating: 1300 },
]

function ref(id: string, rating: number): PlayerRef {
  return { id, rating, displayName: id }
}

describe("matchmaking costs", () => {
  it("balances the strongest and weakest against the middle", () => {
    const weights = buildWeightMatrices(
      players.map((player) => player.id),
      []
    )
    expect(
      bestSplitForFour(["p1", "p2", "p3", "p4"], players, weights, 2).matchup
    ).toEqual(["p1", "p4", "p2", "p3"])
  })

  it("keeps a fixed team together", async () => {
    const fixedTeams: Array<FixedTeam> = [
      { id: "fixed", players: ["p1", "p2"] },
    ]
    const solution = await solveMatching({
      players,
      weights: buildWeightMatrices(
        players.map((player) => player.id),
        []
      ),
      higherRatingWeight: 2,
      fixedTeams,
    })
    expect(solution.matchups[0].slice(0, 2)).toEqual(["p1", "p2"])
  })

  it("partitions several courts with the WASM solver", async () => {
    const eight = Array.from({ length: 8 }, (_, index) => ({
      id: `m${index}`,
      rating: 1700 - index * 50,
    }))
    const solution = await solveMatching({
      players: eight,
      weights: buildWeightMatrices(
        eight.map((player) => player.id),
        []
      ),
      higherRatingWeight: 2,
    })
    expect(solution.matchups).toHaveLength(2)
    expect(new Set(solution.matchups.flat()).size).toBe(8)
  })

  it("finds the optimum in the 16-player case verified against Python", async () => {
    const sixteen = Array.from({ length: 16 }, (_, index) => ({
      id: `r${index}`,
      rating: 1900 - index * 47,
    }))
    const sameTeam = Array.from({ length: 16 }, () => Array<number>(16).fill(0))
    const sameGame = Array.from({ length: 16 }, () => Array<number>(16).fill(0))
    const random = seededRandom(16)
    for (let first = 0; first < sixteen.length; first += 1) {
      for (let second = first + 1; second < sixteen.length; second += 1) {
        const teamWeight = Math.floor(random() * 5) * 4
        const gameWeight = Math.floor(random() * 6) * 2
        sameTeam[first][second] = teamWeight
        sameTeam[second][first] = teamWeight
        sameGame[first][second] = gameWeight
        sameGame[second][first] = gameWeight
      }
    }

    const solution = await solveMatching({
      players: sixteen,
      weights: {
        playerIds: sixteen.map((player) => player.id),
        sameTeam,
        sameGame,
      },
      higherRatingWeight: 2,
    })

    expect(solution.cost).toBeCloseTo(17674.472662222222, 8)
  })
})

describe("weights", () => {
  it("decays once per round and separates older from recent rounds", () => {
    const matrices = buildWeightMatrices(
      ["p1", "p2", "p3", "p4"],
      [
        {
          timestamp: "2026-01-01T18:00:00Z",
          matchups: [
            {
              teamA: ["p1", "p2"],
              teamB: ["p3", "p4"],
            },
            {
              teamA: ["p1", "p3"],
              teamB: ["p2", "p4"],
            },
          ],
        },
        {
          timestamp: "2026-01-09T12:00:00Z",
          matchups: [
            {
              teamA: ["p1", "p4"],
              teamB: ["p2", "p3"],
            },
          ],
        },
      ],
      { now: "2026-01-09T18:00:00Z" }
    )
    expect(matrices.sameTeam[0][1]).toBe(26)
    expect(matrices.sameTeam[0][3]).toBe(68)
  })

  it("truncates the decayed matrices to integers the way NumPy does", () => {
    const matrices = buildWeightMatrices(
      ["p1", "p2"],
      [
        {
          timestamp: "2026-01-01T18:00:00Z",
          matchups: [
            {
              teamA: ["p1", "p2"],
              teamB: ["unknown-1", "unknown-2"],
            },
          ],
        },
      ],
      {
        decayFactor: 0.3,
        now: "2026-01-09T18:00:00Z",
      }
    )
    expect(matrices.sameTeam[0][1]).toBe(5)
    expect(matrices.sameGame[0][1]).toBe(1)
  })
})

describe("random matching", () => {
  it("keeps the cheapest lineup out of three tries", () => {
    const eight = Array.from({ length: 8 }, (_, index) => ({
      id: `z${index}`,
      rating: 1900 - index * 100,
    }))
    const weights = buildWeightMatrices(
      eight.map((player) => player.id),
      []
    )
    const oneTryRandom = seededRandom(42)
    const candidates = Array.from({ length: 3 }, () =>
      randomMatching({
        players: eight,
        weights,
        higherRatingWeight: 2,
        tries: 1,
        random: oneTryRandom,
      })
    )
    const expected = candidates.reduce((best, candidate) =>
      candidate.cost < best.cost ? candidate : best
    )

    const actual = randomMatching({
      players: eight,
      weights,
      higherRatingWeight: 2,
      random: seededRandom(42),
    })

    expect(actual).toEqual(expected)
  })
})

describe("pause selection", () => {
  it("ports the special zero-games quota", () => {
    expect(pauseQuota({ gamesPlayedToday: 0, gamesPausedToday: 2 })).toBe(1002)
    expect(pauseQuota({ gamesPlayedToday: 5, gamesPausedToday: 0 })).toBe(0.1)
  })

  it("pauses fixed teams together", () => {
    const candidates = players.map((player, index) => ({
      player: ref(player.id, player.rating),
      gamesPlayedToday: 2,
      gamesPausedToday: index < 2 ? 0 : 1,
    }))
    const result = selectPlayersToPause(
      candidates,
      2,
      "lowest_first",
      [{ id: "fixed", players: ["p1", "p2"] }],
      () => 0.5
    )
    expect(result.pausing.map((player) => player.id)).toEqual(["p1", "p2"])
  })
})

describe("fixed teams in the pool", () => {
  it("is only active when both players are playing", () => {
    const pool: Pool = {
      updatedAt: "2026-01-01T18:00:00Z",
      entries: [
        { player: ref("p1", 1500), status: "playing" },
        { player: ref("p2", 1500), status: "paused" },
      ],
      fixedTeams: [{ id: "fixed", players: ["p1", "p2"] }],
    }
    expect(activeFixedTeams(pool)).toEqual([])
  })
})

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}
