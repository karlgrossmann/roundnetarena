import { fn } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { ScoreSheet } from "./ScoreSheet"
import { makeFinishedGame, makeGame } from "@/lib/fixtures"

const meta = {
  component: ScoreSheet,
  args: {
    open: true,
    onOpenChange: fn(),
    onSubmit: fn(),
  },
  parameters: {
    // Depending on width the input renders as a drawer or a dialog — either way in a
    // portal outside the story frame.
    layout: "fullscreen",
  },
} satisfies Meta<typeof ScoreSheet>

export default meta

type Story = StoryObj<typeof meta>

/** First entry: both fields empty, operated courtside. */
export const NewResult: Story = {
  args: {
    game: makeGame(),
  },
}

/** Correcting an already recorded result. */
export const Correction: Story = {
  args: {
    game: makeFinishedGame(),
  },
}

/** Without a game the overlay stays empty — it is closing. */
export const WithoutGame: Story = {
  args: {
    game: null,
  },
}
