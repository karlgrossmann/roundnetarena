import type { Meta, StoryObj } from "@storybook/react-vite"

import { OrganizationHeader } from "./OrganizationHeader"

const meta = {
  title: "Organization/OrganizationHeader",
  component: OrganizationHeader,
  args: {
    name: "Roundnet Bielefeld",
    logo: "/logo.png",
  },
} satisfies Meta<typeof OrganizationHeader>

export default meta
type Story = StoryObj<typeof meta>

/** Signed-in area: the subline is the greeting. */
export const WithGreeting: Story = {
  args: { subline: "Guten Morgen, Alex" },
}

/** Public view: no name, the league instead. */
export const WithLeague: Story = {
  args: { subline: "Sommerrunde 2026" },
}

export const WithoutSubline: Story = {
  args: { subline: undefined },
}

/** Long names are truncated rather than wrapped. */
export const LongName: Story = {
  args: {
    name: "Roundnet Sportgemeinschaft Ostwestfalen-Lippe 1889",
    subline: "Guten Abend, Alex",
    logo: null,
  },
}
