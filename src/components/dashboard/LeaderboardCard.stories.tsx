import type { Meta, StoryObj } from "@storybook/react-vite"

import { LeaderboardCard } from "./LeaderboardCard"
import {
  makePlayers,
  makePool,
  makePoolEntries,
  makeTableConfig,
} from "@/lib/fixtures"

const meta = {
  component: LeaderboardCard,
  args: {
    players: makePlayers(12),
    pool: makePool(),
    config: makeTableConfig(),
  },
} satisfies Meta<typeof LeaderboardCard>

export default meta

type Story = StoryObj<typeof meta>

export const Standard: Story = {}

/** All columns shown — on the phone the table has to scroll horizontally. */
export const AllColumns: Story = {
  args: {
    config: makeTableConfig({
      columns: [
        "rating",
        "rd",
        "gamesPlayed",
        "gamesWon",
        "gamesLost",
        "winPercentage",
        "totalRatingChange",
      ],
    }),
  },
}

/** Rating only — the leanest useful view. */
export const RatingOnly: Story = {
  args: {
    config: makeTableConfig({ columns: ["rating"], sortBy: "rating" }),
  },
}

/** Without coloring the rating change. */
export const WithoutColoring: Story = {
  args: {
    config: makeTableConfig({ colorRatingChange: false }),
  },
}

/** Large group with an incomplete pool — filtering down to those present has to work. */
export const LargeGroup: Story = {
  args: {
    players: makePlayers(24),
    pool: makePool({
      entries: makePoolEntries({ playing: 10, paused: 2, absent: 12 }),
    }),
  },
}
