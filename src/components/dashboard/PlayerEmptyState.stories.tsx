import type { Meta, StoryObj } from "@storybook/react-vite"

import { PlayerEmptyState } from "./PlayerEmptyState"
import { makeSettings } from "@/lib/fixtures"

const meta = {
  component: PlayerEmptyState,
  args: {
    settings: makeSettings(),
  },
} satisfies Meta<typeof PlayerEmptyState>

export default meta

type Story = StoryObj<typeof meta>

/** A freshly created group: the table is replaced by the entry point. */
export const EmptyGroup: Story = {}
