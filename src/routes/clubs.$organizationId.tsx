import { createFileRoute, redirect } from "@tanstack/react-router"

import { organizationSettingsRoute } from "@/lib/api/league-route"
import { organizationsQueryOptions } from "@/lib/api/queries"

export const Route = createFileRoute("/clubs/$organizationId")({
  loader: async ({ context, params }) => {
    const organizations = await context.queryClient.ensureQueryData(
      organizationsQueryOptions()
    )
    const organization = organizations.find(
      (candidate) => candidate.id === params.organizationId
    )
    const settingsRoute = organization
      ? organizationSettingsRoute(organization)
      : null

    if (!settingsRoute) {
      throw redirect({ to: "/clubs", replace: true })
    }
    throw redirect({
      ...settingsRoute,
      replace: true,
    })
  },
})
