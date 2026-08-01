import { fn } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { PoolCard } from "./PoolCard"
import { makePoolEntries } from "@/lib/fixtures"

const meta = {
  component: PoolCard,
  args: {
    entries: makePoolEntries(),
    onToggle: fn(),
    onAddAll: fn(),
    onClear: fn(),
    onAddGuest: fn(),
  },
} satisfies Meta<typeof PoolCard>

export default meta

type Story = StoryObj<typeof meta>

/** An ordinary match day: eight in, two pausing, two absent. */
export const Standard: Story = {}

/** Before the first tap nobody is assigned. */
export const NiemandAusgewählt: Story = {
  args: {
    entries: makePoolEntries({ playing: 0, paused: 0, absent: 10 }),
  },
}

/** Full group — the tile columns have to hold up to 24 players. */
export const GroßeGruppe: Story = {
  args: {
    entries: makePoolEntries({ playing: 16, paused: 4, absent: 4 }),
  },
}

/** Everyone present: the clear-out path has to stay reachable even then. */
export const AlleDabei: Story = {
  args: {
    entries: makePoolEntries({ playing: 12, paused: 0, absent: 0 }),
  },
}
