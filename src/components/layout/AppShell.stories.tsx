import type { Meta, StoryObj } from "@storybook/react-vite"

import { AppShell } from "./AppShell"
import type { QuerySeed } from "@storybook-config/decorators/with-query-client"
import { queryKeys } from "@/lib/api/queries"

/**
 * The template for components that depend on the router.
 *
 * `AppShell` reads the page title from the route's `staticData` via `useMatches()` and
 * links the main navigation. The decorator provides an in-memory router for that; which
 * title it reports is controlled by `parameters.route.titleKey`.
 */
const meta = {
  component: AppShell,
  args: {
    children: (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Page content
      </div>
    ),
  },
  parameters: {
    layout: "fullscreen",
    query: [[queryKeys.organizations, []]] satisfies QuerySeed,
  },
} satisfies Meta<typeof AppShell>

export default meta

type Story = StoryObj<typeof meta>

/**
 * On the phone the header bar carries the page title and the navigation sits at the
 * bottom. From `md` up it flips: crest left, tabs in the middle, menu right — the title
 * then lives in the content.
 */
export const Overview: Story = {
  parameters: {
    route: { titleKey: "round" },
  },
}

/**
 * Without a league in the route the bar carries no tabs. The title then stays visible on
 * desktop too — otherwise the bar would be empty there.
 */
export const WithoutNavigation: Story = {
  parameters: {
    route: { titleKey: "organizations" },
  },
}

/** Long content: the header bar stays put while scrolling. */
export const WithLongContent: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 20 }, (_unused, index) => (
          <div key={index} className="rounded-lg border p-6">
            Section {index + 1}
          </div>
        ))}
      </div>
    ),
  },
}
