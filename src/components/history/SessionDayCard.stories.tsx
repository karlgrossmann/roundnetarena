import type { Meta, StoryObj } from "@storybook/react-vite"

import { SessionDayCard } from "./SessionDayCard"
import { makeSessionDay } from "@/lib/fixtures"

const meta = {
  component: SessionDayCard,
  args: {
    activeRoundLink: {
      mode: "member",
      organizationSlug: "roundnet-club",
      leagueId: "league_main",
    },
  },
} satisfies Meta<typeof SessionDayCard>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The label comes from `sessionDayLabel()` and is hardcoded here: it depends on the
 * current time, and a story should look the same on every run.
 */
export const Today: Story = {
  args: {
    day: makeSessionDay(4),
    label: "Heute",
  },
}

export const EarlierEvening: Story = {
  args: {
    day: makeSessionDay(3, 7),
    label: "Donnerstag, 16. Juli",
  },
}

/** A session day with a single round — the card must not look empty. */
export const SingleRound: Story = {
  args: {
    day: makeSessionDay(1, 14),
    label: "Donnerstag, 9. Juli",
  },
}
