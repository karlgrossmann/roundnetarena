import type { Meta, StoryObj } from "@storybook/react-vite"

import { OrganizationLogo } from "./OrganizationLogo"

const meta = {
  title: "Organization/OrganizationLogo",
  component: OrganizationLogo,
  args: {
    name: "Roundnet Bielefeld",
    className: "size-28",
  },
} satisfies Meta<typeof OrganizationLogo>

export default meta
type Story = StoryObj<typeof meta>

export const Fallback: Story = {
  args: { logo: null },
}

export const StoredLogo: Story = {
  args: { logo: "/logo.png" },
}
