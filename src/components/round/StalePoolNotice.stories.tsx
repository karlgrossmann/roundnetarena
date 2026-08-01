import { fn } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { StalePoolNotice } from "./StalePoolNotice"
import { hoursAgo } from "@/lib/fixtures"

const meta = {
  component: StalePoolNotice,
  args: {
    onKeep: fn(),
    onRestart: fn(),
  },
} satisfies Meta<typeof StalePoolNotice>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The pool is from the last match day. The question is asked because a pool survives
 * several rounds and would otherwise quietly carry over to the next date.
 *
 * `hoursAgo()` counts from the real clock — with a fixed timestamp the notice would be
 * due on some calendar days and not on others.
 */
export const VomLetztenAbend: Story = {
  args: { updatedAt: hoursAgo(20) },
}

/** Several days old — the timestamp has to stay readable even then. */
export const MehrereTageAlt: Story = {
  args: { updatedAt: hoursAgo(76) },
}
