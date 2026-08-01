import type { Meta, StoryObj } from "@storybook/react-vite"

import { StatTile } from "./StatTile"

const meta = {
  component: StatTile,
  decorators: [
    (Story) => (
      <div className="w-40">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatTile>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { value: 24, label: "Spieler" },
}

/** Four-digit values have to fit the tile without wrapping. */
export const LargeNumber: Story = {
  args: { value: 1412, label: "Spiele insgesamt" },
}

export const Zero: Story = {
  args: { value: 0, label: "Spiele heute" },
}
