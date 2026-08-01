/**
 * Pool fixtures: who is present today, who is paused, who would have to sit out.
 */

import { fixtureId } from "./ids"
import { makePlayers, toPlayerRef } from "./players"
import { hoursAgo } from "./time"
import type {
  FixedTeam,
  PauseCandidate,
  Pool,
  PoolEntry,
  PoolStatus,
} from "../types"

export interface PoolComposition {
  playing?: number
  paused?: number
  absent?: number
}

const DEFAULT_COMPOSITION: Required<PoolComposition> = {
  playing: 8,
  paused: 2,
  absent: 2,
}

/**
 * Pool entries in the order playing → paused → absent.
 *
 * The players come from `makePlayers()` and therefore carry the same IDs — only then do
 * `poolEntriesForPlayers()` and the pool view line up again.
 */
export function makePoolEntries(
  composition: PoolComposition = {}
): Array<PoolEntry> {
  const { playing, paused, absent } = { ...DEFAULT_COMPOSITION, ...composition }
  const statuses: Array<PoolStatus> = [
    ...Array<PoolStatus>(playing).fill("playing"),
    ...Array<PoolStatus>(paused).fill("paused"),
    ...Array<PoolStatus>(absent).fill("absent"),
  ]

  return makePlayers(statuses.length).map((player, index) => ({
    player: toPlayerRef(player),
    status: statuses[index],
  }))
}

export function makePoolEntry(overrides: Partial<PoolEntry> = {}): PoolEntry {
  const [entry] = makePoolEntries({ playing: 1, paused: 0, absent: 0 })
  return { ...entry, ...overrides }
}

/**
 * A pool as a running session has it.
 *
 * `updatedAt` deliberately sits one hour in the past and thus **relative to the real
 * clock**: `isPoolStale()` compares against `useNow()`, and a fixed timestamp would read
 * as fresh or stale depending on the calendar day. For the stale pool write
 * `makePool({ updatedAt: hoursAgo(20) })`.
 */
export function makePool(overrides: Partial<Pool> = {}): Pool {
  return {
    updatedAt: hoursAgo(1),
    entries: makePoolEntries(),
    fixedTeams: [],
    ...overrides,
  }
}

/** A fixed pair made from the first two players of the pool. */
export function makeFixedTeam(overrides: Partial<FixedTeam> = {}): FixedTeam {
  return {
    id: fixtureId("fixed_team", 1),
    players: [fixtureId("player", 1), fixtureId("player", 2)],
    ...overrides,
  }
}

/**
 * The "who would sit out?" preview, ascending by `pauseQuota` — exactly as
 * `fetchPausePreview()` returns it. The first `pausingCount` entries are marked
 * `willPause`.
 */
export function makePauseCandidates(
  count = 10,
  pausingCount = 2
): Array<PauseCandidate> {
  return makePlayers(count)
    .map((player, index) => {
      const gamesPlayedToday = 2 + (index % 4)
      const gamesPausedToday = index % 3

      return {
        player: toPlayerRef(player),
        gamesPlayedToday,
        gamesPausedToday,
        pauseQuota: gamesPausedToday / gamesPlayedToday,
        willPause: false,
      }
    })
    .toSorted((left, right) => left.pauseQuota - right.pauseQuota)
    .map((candidate, index) => ({
      ...candidate,
      willPause: index < pausingCount,
    }))
}
