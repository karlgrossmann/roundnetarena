/**
 * Player fixtures for tests and stories.
 *
 * Shapes come exclusively from `src/lib/types.ts` — no local variants are defined here.
 */

import { fixtureId } from "./ids"
import { FIXTURE_NOW, fixtureDaysBefore } from "./time"
import type { Player, PlayerGame, PlayerRef, RatingPoint } from "../types"

/** Names for `makePlayers()`. Enough for a full session day of 20 to 24 attendees. */
const NAMES: ReadonlyArray<readonly [string, string]> = [
  ["Klara", "Nowak"],
  ["Jonas", "Berger"],
  ["Mira", "Sattler"],
  ["Tobias", "Rehm"],
  ["Lena", "Falk"],
  ["Samuel", "Ortmann"],
  ["Nele", "Brandt"],
  ["Hendrik", "Vogt"],
  ["Alina", "Kessler"],
  ["Milan", "Roth"],
  ["Frieda", "Kaiser"],
  ["Bastian", "Lorenz"],
  ["Sophie", "Wendt"],
  ["Arne", "Petersen"],
  ["Johanna", "Rieger"],
  ["Kilian", "Amann"],
  ["Marlene", "Schuster"],
  ["Fabian", "Kruse"],
  ["Ida", "Hartmann"],
  ["Levin", "Braun"],
  ["Carla", "Neumann"],
  ["Ruben", "Seifert"],
  ["Emilia", "Gerlach"],
  ["Anton", "Weiß"],
]

/** Short form as the backend produces it: "Klara N." */
function shortName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName.slice(0, 1)}.`
}

/**
 * A player with complete statistics. Without overrides always the same one.
 *
 * Overriding `firstName` or `lastName` means setting `displayName` too — otherwise the
 * display no longer matches the name. The backend derives it, the frontend never does.
 */
export function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: fixtureId("player", 1),
    firstName: "Klara",
    lastName: "Nowak",
    displayName: "Klara N.",
    rating: 1631,
    rd: 52,
    gamesPlayed: 84,
    gamesWon: 47,
    gamesLost: 37,
    gamesPaused: 12,
    totalRatingChange: 131,
    ...overrides,
  }
}

/**
 * `count` distinct players with scattered ratings.
 *
 * The scatter follows a fixed formula rather than the index so the list does not arrive
 * accidentally sorted — otherwise broken leaderboard sorting would look correct.
 */
export function makePlayers(count: number): Array<Player> {
  return Array.from({ length: count }, (_unused, index) => {
    const [firstName, lastName] = NAMES[index % NAMES.length]
    const generation = Math.floor(index / NAMES.length)

    return makePlayer({
      id: fixtureId("player", index + 1),
      firstName,
      lastName: generation === 0 ? lastName : `${lastName}${generation + 1}`,
      displayName: shortName(firstName, lastName),
      rating: 1420 + ((index * 137) % 331),
      rd: 45 + ((index * 23) % 81),
      gamesPlayed: 12 + ((index * 7) % 90),
      gamesWon: 6 + ((index * 5) % 44),
      gamesLost: 5 + ((index * 3) % 42),
      gamesPaused: (index * 2) % 15,
      totalRatingChange: ((index * 97) % 401) - 200,
    })
  })
}

/** The slim reference to an existing player. */
export function toPlayerRef(player: Player): PlayerRef {
  return {
    id: player.id,
    displayName: player.displayName,
    rating: player.rating,
  }
}

export function makePlayerRef(overrides: Partial<PlayerRef> = {}): PlayerRef {
  return {
    id: fixtureId("player", 1),
    displayName: "Klara N.",
    rating: 1631,
    ...overrides,
  }
}

/**
 * A removed player: the name data is irreversibly gone, the label is only produced at
 * the presentation boundary via `playerRefDisplayName()`.
 */
export function makeAnonymizedPlayerRef(
  overrides: Partial<PlayerRef> = {}
): PlayerRef {
  return makePlayerRef({
    id: fixtureId("player", 99),
    displayName: "",
    anonymizedKey: "4f2a",
    ...overrides,
  })
}

/**
 * A rating history over `count` days, ending at `FIXTURE_NOW`.
 *
 * The curve rises with a dip in the middle so a chart of it shows something, and the RD
 * drops with every game — the way Glicko-2 actually behaves.
 */
export function makeRatingHistory(count = 12): Array<RatingPoint> {
  return Array.from({ length: count }, (_unused, index) => ({
    timestamp:
      index === count - 1 ? FIXTURE_NOW : fixtureDaysBefore(count - 1 - index),
    rating: 1500 + index * 12 - (index > count / 2 ? 45 : 0),
    rd: Math.max(45, 125 - index * 6),
  }))
}

export function makePlayerGame(
  overrides: Partial<PlayerGame> = {}
): PlayerGame {
  return {
    gameId: fixtureId("game", 1),
    timestamp: fixtureDaysBefore(1),
    partner: makePlayerRef({
      id: fixtureId("player", 2),
      displayName: "Jonas B.",
    }),
    opponents: [
      makePlayerRef({ id: fixtureId("player", 3), displayName: "Mira S." }),
      makePlayerRef({ id: fixtureId("player", 4), displayName: "Tobias R." }),
    ],
    ownPoints: 21,
    opponentPoints: 17,
    won: true,
    ratingBefore: 1612,
    ratingAfter: 1631,
    ...overrides,
  }
}
