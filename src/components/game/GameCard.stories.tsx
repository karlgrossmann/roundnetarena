import { fn } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { GameCard } from "./GameCard"
import { makeFinishedGame, makeGame } from "@/lib/fixtures"

const meta = {
  component: GameCard,
  args: {
    preview: true,
    onEnterResult: fn(),
    onCorrectResult: fn(),
    onCancel: fn(),
    onUncancel: fn(),
  },
} satisfies Meta<typeof GameCard>

export default meta

type Story = StoryObj<typeof meta>

/** No result recorded: the card leads to the score input. */
export const Open: Story = {
  args: {
    game: makeGame(),
  },
}

/**
 * Result recorded, round not committed yet. The rating changes sit on a muted surface
 * behind a dashed line — they are reversible.
 */
export const ResultAsPreview: Story = {
  args: {
    game: makeFinishedGame(),
  },
}

/** After the round is committed: same numbers, but binding. */
export const ResultCommitted: Story = {
  args: {
    game: makeFinishedGame(),
    preview: false,
  },
}

/** Close finish — the score has to stay readable at arm's length. */
export const CloseResult: Story = {
  args: {
    game: makeFinishedGame({}, 22, 20),
  },
}

/** Cancelled: stays visible, but no longer counts. */
export const Cancelled: Story = {
  args: {
    game: makeGame({ status: "cancelled" }),
  },
}

/** While a mutation is running, the whole card is locked. */
export const Locked: Story = {
  args: {
    game: makeGame(),
    disabled: true,
  },
}
