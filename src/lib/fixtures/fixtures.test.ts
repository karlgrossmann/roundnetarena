import { describe, expect, it } from "vitest"

import {
  hoursAgo,
  makeFinishedGame,
  makeGames,
  makePlayers,
  makePool,
  makePoolEntries,
  makeRound,
} from "./index"
import { countPoolStatus, poolEntriesForPlayers } from "../pool"
import { canCommitRound, canStartRound, isPoolStale } from "../round"

/**
 * What is tested is not the shape of the fixtures — TypeScript guarantees that. What is
 * tested is that they fit the domain code: fixtures that slip past
 * `poolEntriesForPlayers()` or assign a player twice silently produce wrong tests and
 * wrong stories.
 */
describe("fixtures", () => {
  it("assigns unique player IDs", () => {
    const players = makePlayers(24)
    const ids = new Set(players.map((player) => player.id))

    expect(ids.size).toBe(24)
  })

  it("joins players and pool through the same IDs", () => {
    const players = makePlayers(12)
    const pool = makePool({
      entries: makePoolEntries({ playing: 8, paused: 2, absent: 2 }),
    })

    const entries = poolEntriesForPlayers(players, pool)
    const counts = countPoolStatus(entries)

    // No player falls through: the mapping covers all twelve.
    expect(entries).toHaveLength(12)
    expect(counts.playing).toBe(8)
    expect(counts.paused).toBe(2)
  })

  it("returns a pool a round can be started from", () => {
    expect(canStartRound(makePool())).toBe(true)
  })

  it("counts as fresh as long as updatedAt is not overridden", () => {
    expect(isPoolStale(makePool())).toBe(false)
    expect(isPoolStale(makePool({ updatedAt: hoursAgo(20) }))).toBe(true)
  })

  it("assigns four distinct players to every game", () => {
    const games = makeGames(3)
    const ids = games.flatMap((game) =>
      [...game.teamA.players, ...game.teamB.players].map((player) => player.id)
    )

    expect(new Set(ids).size).toBe(12)
  })

  it("creates a round that can only be committed once every result is in", () => {
    const round = makeRound()
    expect(canCommitRound(round)).toBe(false)

    const finished = makeRound({
      games: round.games.map((game) => makeFinishedGame(game)),
    })
    expect(canCommitRound(finished)).toBe(true)
  })

  it("spreads a game's rating change across all four participants", () => {
    const game = makeFinishedGame()

    expect(game.result?.ratingChanges).toHaveLength(4)
    expect(
      game.result?.ratingChanges.every((change) => change.delta !== 0)
    ).toBe(true)
  })
})
