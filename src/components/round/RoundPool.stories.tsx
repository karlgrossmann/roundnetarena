import type { Meta, StoryObj } from "@storybook/react-vite"

import { RoundPool } from "./RoundPool"
import type { QuerySeed } from "@storybook-config/decorators/with-query-client"
import {
  hoursAgo,
  makePauseCandidates,
  makePlayers,
  makePool,
  makePoolEntries,
  makeSettings,
  fixtureLeagueContext,
} from "@/lib/fixtures"
import { queryKeys } from "@/lib/api/queries"

/**
 * The template for components that pull their own data from the cache.
 *
 * `RoundPool` calls `useSuspenseQuery` for pool, players and settings. Instead of
 * reworking the component, the story seeds the finished data under the same query keys
 * the application uses. No server function is called; a missing entry would fail the
 * story with a clear message.
 *
 * **Boundary:** write actions — generate round, save pool — run into the stub and end in
 * the component's error state. That is the deliberate boundary of this setup, not a bug.
 */
const meta = {
  component: RoundPool,
} satisfies Meta<typeof RoundPool>

export default meta

type Story = StoryObj<typeof meta>

/** Eight present make two courts — the preview shows who sits out then. */
export const Standard: Story = {
  parameters: {
    query: [
      [queryKeys.players(fixtureLeagueContext), makePlayers(12)],
      [queryKeys.pool(fixtureLeagueContext), makePool()],
      [queryKeys.settings(fixtureLeagueContext), makeSettings()],
      [
        queryKeys.pausePreview(fixtureLeagueContext, 2),
        makePauseCandidates(8, 0),
      ],
    ] satisfies QuerySeed,
  },
}

/** Nobody assigned yet: the round cannot be started. */
export const NiemandEingeteilt: Story = {
  parameters: {
    query: [
      [queryKeys.players(fixtureLeagueContext), makePlayers(12)],
      [
        queryKeys.pool(fixtureLeagueContext),
        makePool({
          entries: makePoolEntries({ playing: 0, paused: 0, absent: 12 }),
        }),
      ],
      [queryKeys.settings(fixtureLeagueContext), makeSettings()],
      [
        queryKeys.pausePreview(fixtureLeagueContext, 1),
        makePauseCandidates(0, 0),
      ],
    ] satisfies QuerySeed,
  },
}

/**
 * The pool is from the last match day — the notice appears above everything else. It
 * depends on `useNow()`, so `updatedAt` is set relative to the real clock.
 */
export const VeralteterPool: Story = {
  parameters: {
    query: [
      [queryKeys.players(fixtureLeagueContext), makePlayers(12)],
      [
        queryKeys.pool(fixtureLeagueContext),
        makePool({ updatedAt: hoursAgo(20) }),
      ],
      [queryKeys.settings(fixtureLeagueContext), makeSettings()],
      [
        queryKeys.pausePreview(fixtureLeagueContext, 2),
        makePauseCandidates(8, 0),
      ],
    ] satisfies QuerySeed,
  },
}

/** Without players in the group the onboarding replaces the pool. */
export const OhneSpieler: Story = {
  parameters: {
    query: [
      [queryKeys.players(fixtureLeagueContext), []],
      [queryKeys.pool(fixtureLeagueContext), makePool({ entries: [] })],
      [queryKeys.settings(fixtureLeagueContext), makeSettings()],
    ] satisfies QuerySeed,
  },
}

/** Full group on four courts, with players sitting out. */
export const GroßeGruppe: Story = {
  parameters: {
    query: [
      [queryKeys.players(fixtureLeagueContext), makePlayers(24)],
      [
        queryKeys.pool(fixtureLeagueContext),
        makePool({
          entries: makePoolEntries({ playing: 18, paused: 2, absent: 4 }),
        }),
      ],
      [queryKeys.settings(fixtureLeagueContext), makeSettings()],
      [
        queryKeys.pausePreview(fixtureLeagueContext, 4),
        makePauseCandidates(18, 2),
      ],
    ] satisfies QuerySeed,
  },
}
