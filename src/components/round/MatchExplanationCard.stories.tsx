import type { Meta, StoryObj } from "@storybook/react-vite"

import { MatchExplanationCard } from "./MatchExplanationCard"
import { makeMatchExplanation, makePlayers, toPlayerRef } from "@/lib/fixtures"

const meta = {
  component: MatchExplanationCard,
  args: {
    explanation: makeMatchExplanation(),
    players: makePlayers(8).map(toPlayerRef),
  },
} satisfies Meta<typeof MatchExplanationCard>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Collapsed — how it normally sits. The question "why these matchups?" comes up rarely,
 * but when it does the answer has to be verifiable.
 */
export const Standard: Story = {}

/** Without counter-lineups only the chosen solution remains. */
export const OhneAlternativen: Story = {
  args: {
    explanation: makeMatchExplanation({ alternatives: [] }),
  },
}
