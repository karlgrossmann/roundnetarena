import { fn } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { PlayerTile } from "./PlayerTile"
import { makePlayerRef } from "@/lib/fixtures"

const meta = {
  component: PlayerTile,
  args: {
    player: makePlayerRef(),
    onToggle: fn(),
  },
  // The tile fills its column — without a bound it would run across the full width.
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerTile>

export default meta

type Story = StoryObj<typeof meta>

/** Not here today. One tap adds the player to the pool. */
export const Absent: Story = {
  args: { status: "absent" },
}

/** Playing: highlighted, with rating. */
export const Playing: Story = {
  args: { status: "playing" },
}

/**
 * Paused. Dashed and muted, not red — pausing is not an error state, and the state
 * replaces the rating in words.
 */
export const Paused: Story = {
  args: { status: "paused" },
}

/** While the pool is being saved, nothing can be toggled. */
export const Locked: Story = {
  args: { status: "playing", disabled: true },
}

/** Long names must not blow up the tile. */
export const LongName: Story = {
  args: {
    status: "playing",
    player: makePlayerRef({
      displayName: "Maximiliane Sch.",
      rating: 1487,
    }),
  },
}
