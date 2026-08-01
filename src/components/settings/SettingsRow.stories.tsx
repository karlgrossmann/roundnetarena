import { fn } from "storybook/test"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { SettingsRow } from "./SettingsRow"
import { Switch } from "@/components/ui/switch"

const meta = {
  component: SettingsRow,
} satisfies Meta<typeof SettingsRow>

export default meta

type Story = StoryObj<typeof meta>

/** The regular case: value on the right, a tap opens the panel. */
export const WithValue: Story = {
  args: {
    label: "Gewicht starker Spieler",
    description: "Höher heißt ausgeglichenere Spitzenteams.",
    value: "2,0",
    onOpen: fn(),
  },
}

/** Without `onOpen` the row is display-only and not clickable. */
export const DisplayOnly: Story = {
  args: {
    label: "Start-Rating",
    value: "1500",
  },
}

/** A switch sits in the row itself — no panel needed for that. */
export const WithSwitch: Story = {
  args: {
    label: "Rating-Änderung einfärben",
    description: "Grün für Gewinn, rot für Verlust.",
    control: <Switch defaultChecked />,
  },
}

/** Without a description the row stays on a single line. */
export const WithoutDescription: Story = {
  args: {
    label: "Verfahren",
    value: "Ausgeglichen",
    onOpen: fn(),
  },
}
