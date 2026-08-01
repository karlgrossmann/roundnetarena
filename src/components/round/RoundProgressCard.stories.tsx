import type { Meta, StoryObj } from "@storybook/react-vite"

import { RoundProgressCard } from "./RoundProgressCard"
import { Button } from "@/components/ui/button"
import {
  makeFinishedGame,
  makeGame,
  makeGames,
  makeRound,
} from "@/lib/fixtures"

const meta = {
  component: RoundProgressCard,
} satisfies Meta<typeof RoundProgressCard>

export default meta

type Story = StoryObj<typeof meta>

/** Freshly generated: no game entered. */
export const NochNichtsEingetragen: Story = {
  args: { round: makeRound() },
}

/** One game entered, two missing — the round cannot be committed yet. */
export const TeilweiseEingetragen: Story = {
  args: {
    round: makeRound({
      games: makeGames(3).map((game, index) =>
        index === 0 ? makeFinishedGame(game) : game
      ),
    }),
  },
}

/** Everything entered: only now may the round be scored. */
export const Vollständig: Story = {
  args: {
    round: makeRound({
      games: makeGames(3).map((game) => makeFinishedGame(game)),
    }),
  },
}

/**
 * A cancelled game counts as done — otherwise a round with a dropped court could never
 * be committed.
 */
export const MitAbsage: Story = {
  args: {
    round: makeRound({
      games: makeGames(3).map((game, index) =>
        index === 2
          ? makeGame({ ...game, status: "cancelled" })
          : makeFinishedGame(game)
      ),
    }),
  },
}

/** With a side action — it affects several games and therefore sits here. */
export const MitNebenaktion: Story = {
  args: {
    round: makeRound(),
    action: (
      <Button variant="ghost" size="sm">
        Offene Spiele absagen
      </Button>
    ),
  },
}
