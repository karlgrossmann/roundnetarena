/**
 * Round and game fixtures.
 *
 * Important for everything built from these: rating changes on a round with
 * `status: "active"` are a **preview**. Only `status: "committed"` makes them binding.
 */

import { fixtureId } from "./ids"
import { makePlayers, toPlayerRef } from "./players"
import { fixtureHoursBefore } from "./time"
import type {
  Game,
  GameResult,
  MatchExplanation,
  PausingPlayer,
  PlayerRef,
  RatingChange,
  Round,
  Team,
} from "../types"

/** The player references all round fixtures are built from. */
function refs(count: number): Array<PlayerRef> {
  return makePlayers(count).map(toPlayerRef)
}

/** A team of two players from the default field, 0-based indices. */
export function makeTeam(first: number, second: number): Team {
  const pool = refs(Math.max(first, second) + 1)
  return { players: [pool[first], pool[second]] }
}

export function makeRatingChange(
  overrides: Partial<RatingChange> = {}
): RatingChange {
  const ratingBefore = overrides.ratingBefore ?? 1612
  const delta = overrides.delta ?? 19

  return {
    player: toPlayerRef(makePlayers(1)[0]),
    ratingBefore,
    ratingAfter: ratingBefore + delta,
    delta,
    ...overrides,
  }
}

/**
 * A result including rating changes for all four participants: the winners gain, the
 * losers drop by roughly the same amount.
 */
export function makeGameResult(
  game: Pick<Game, "teamA" | "teamB">,
  pointsA = 21,
  pointsB = 17
): GameResult {
  const aWon = pointsA > pointsB
  const magnitude = 12

  const changes = [
    ...game.teamA.players.map((player, index) =>
      makeRatingChange({
        player,
        ratingBefore: player.rating,
        delta: (aWon ? magnitude : -magnitude) + index,
      })
    ),
    ...game.teamB.players.map((player, index) =>
      makeRatingChange({
        player,
        ratingBefore: player.rating,
        delta: (aWon ? -magnitude : magnitude) - index,
      })
    ),
  ]

  return { pointsA, pointsB, ratingChanges: changes }
}

/** An open game on court 1. `status: "finished"` additionally needs `result`. */
export function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: fixtureId("game", 1),
    court: 1,
    status: "open",
    teamA: makeTeam(0, 1),
    teamB: makeTeam(2, 3),
    ...overrides,
  }
}

/**
 * A finished game with matching rating changes.
 *
 * `status` comes last and is therefore not overridable — otherwise this function could
 * return an open game that carries a result.
 */
export function makeFinishedGame(
  overrides: Partial<Game> = {},
  pointsA = 21,
  pointsB = 17
): Game {
  const game = makeGame({ ...overrides, status: "finished" })
  return {
    ...game,
    result: overrides.result ?? makeGameResult(game, pointsA, pointsB),
  }
}

/** `courts` games, each with four players of its own. */
export function makeGames(courts: number): Array<Game> {
  const pool = refs(courts * 4)

  return Array.from({ length: courts }, (_unused, index) => {
    const offset = index * 4
    return makeGame({
      id: fixtureId("game", index + 1),
      court: index + 1,
      teamA: { players: [pool[offset], pool[offset + 1]] },
      teamB: { players: [pool[offset + 2], pool[offset + 3]] },
    })
  })
}

export function makePausingPlayers(
  count: number,
  offset: number
): Array<PausingPlayer> {
  return refs(offset + count)
    .slice(offset)
    .map((player, index) => ({
      player,
      reason: index % 2 === 0 ? "assigned" : "voluntary",
    }))
}

/**
 * A running round with three courts and two players sitting out.
 *
 * For the committed round use `makeRound({ status: "committed" })`; for the state just
 * before commit, replace the games via `games` with `makeFinishedGame()`.
 */
export function makeRound(overrides: Partial<Round> = {}): Round {
  const games = overrides.games ?? makeGames(3)

  return {
    id: fixtureId("block", 1),
    number: 4,
    startedAt: fixtureHoursBefore(1),
    status: "active",
    games,
    pausing: makePausingPlayers(2, games.length * 4),
    ...overrides,
  }
}

/**
 * The matcher's explanation: the chosen lineup plus three alternatives that each improve
 * one criterion and cost more for it.
 */
export function makeMatchExplanation(
  overrides: Partial<MatchExplanation> = {}
): MatchExplanation {
  const ids = (count: number) =>
    Array.from({ length: count }, (_unused, index) =>
      fixtureId("player", index + 1)
    )
  const [a, b, c, d, e, f, g, h] = ids(8)

  return {
    version: 1,
    matcher: "default",
    chosen: {
      id: "chosen",
      cost: 184.5,
      matchups: [
        { teamA: [a, b], teamB: [c, d] },
        { teamA: [e, f], teamB: [g, h] },
      ],
    },
    alternatives: [
      {
        id: "ratingRange",
        cost: 201.25,
        costDelta: 16.75,
        matchups: [
          { teamA: [a, c], teamB: [b, d] },
          { teamA: [e, g], teamB: [f, h] },
        ],
      },
      {
        id: "teamDifference",
        cost: 192.0,
        costDelta: 7.5,
        matchups: [
          { teamA: [a, d], teamB: [b, c] },
          { teamA: [e, h], teamB: [f, g] },
        ],
      },
      {
        id: "repeatedPlayers",
        cost: 213.75,
        costDelta: 29.25,
        matchups: [
          { teamA: [a, e], teamB: [c, g] },
          { teamA: [b, f], teamB: [d, h] },
        ],
      },
    ],
    ...overrides,
  }
}
