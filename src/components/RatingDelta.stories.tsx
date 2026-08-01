import type { Meta, StoryObj } from "@storybook/react-vite"

import { RatingDelta } from "./RatingDelta"

const meta = {
  component: RatingDelta,
} satisfies Meta<typeof RatingDelta>

export default meta

type Story = StoryObj<typeof meta>

export const Gain: Story = {
  args: { delta: 19 },
}

export const Loss: Story = {
  args: { delta: -14 },
}

/** There are no draws, but a change of zero does happen. */
export const Unchanged: Story = {
  args: { delta: 0 },
}

/**
 * Before the round is committed: same number, muted. The difference from the committed
 * state has to be recognizable at a glance.
 */
export const Preview: Story = {
  args: { delta: 19, preview: true },
}

/** Small size for the strip below a game card. */
export const Small: Story = {
  args: { delta: -14, size: "sm" },
}
