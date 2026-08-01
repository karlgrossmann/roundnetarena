/**
 * Shared test data for unit tests and Storybook.
 *
 * Two rules keep it reliable:
 *
 * 1. **Shapes come from `src/lib/types.ts`.** No local variants of them are defined here.
 * 2. **Every builder takes `overrides` and returns a new object.** Nothing is shared or
 *    mutated; two calls never interfere.
 *
 * Timestamps are anchored to `FIXTURE_NOW`. The one exception is `makePool()`, whose
 * `updatedAt` is relative to the real clock — reasoned out in `time.ts`.
 */

export { fixtureId } from "./ids"
export {
  FIXTURE_NOW,
  daysAgo,
  fixtureDaysBefore,
  fixtureHoursBefore,
  hoursAgo,
} from "./time"

export {
  makeAnonymizedPlayerRef,
  makePlayer,
  makePlayerGame,
  makePlayerRef,
  makePlayers,
  makeRatingHistory,
  toPlayerRef,
} from "./players"

export {
  makeFixedTeam,
  makePauseCandidates,
  makePool,
  makePoolEntries,
  makePoolEntry,
} from "./pool"
export type { PoolComposition } from "./pool"

export {
  makeFinishedGame,
  makeGame,
  makeGameResult,
  makeGames,
  makeMatchExplanation,
  makePausingPlayers,
  makeRatingChange,
  makeRound,
  makeTeam,
} from "./rounds"

export { makeHistory, makeRoundSummary, makeSessionDay } from "./history"

export { makeSettings, makeSummary, makeTableConfig } from "./settings"
export { fixtureLeagueContext } from "./league"
