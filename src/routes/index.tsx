import { createFileRoute, redirect } from "@tanstack/react-router"

import { defaultLeagueHref } from "@/lib/api/league-route"
import { organizationsQueryOptions } from "@/lib/api/queries"

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const organizations = await context.queryClient.ensureQueryData(
      organizationsQueryOptions()
    )
    throw redirect({ href: defaultLeagueHref(organizations), replace: true })
  },
})
