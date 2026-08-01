import { fn } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { TimeRangeFilter } from "./TimeRangeFilter"
import { historyRangeOptions } from "@/lib/history"

const meta = {
  component: TimeRangeFilter,
  args: {
    options: historyRangeOptions(),
    value: "four-weeks",
    label: "Zeitraum",
    onChange: fn(),
  },
} satisfies Meta<typeof TimeRangeFilter>

export default meta

type Story = StoryObj<typeof meta>

export const FourWeeks: Story = {}

export const AllTime: Story = {
  args: { value: "all" },
}

/** Small size for a card header. */
export const Small: Story = {
  args: { value: "six-months", size: "sm" },
}

/**
 * A custom range matches none of the presets — no toggle may appear selected then.
 */
export const CustomRange: Story = {
  args: {
    value: { kind: "custom", from: "2026-05-01", to: "2026-06-30" },
  },
}
