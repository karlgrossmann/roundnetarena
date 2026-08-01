import { createFileRoute } from "@tanstack/react-router"

import { CreateLeagueForm } from "@/components/league/CreateLeagueForm"
import { ensureLeagueRouteContext } from "@/lib/api/league-route"
import { localizedRouteHead } from "@/lib/i18n"

export const Route = createFileRoute(
  "/o/$organizationSlug/l/$leagueId/leagues/new"
)({
  staticData: { titleKey: "createLeague" },
  head: () => localizedRouteHead("createLeague"),
  loader: ({ context, params }) =>
    ensureLeagueRouteContext(context.queryClient, params),
  component: CreateLeagueForm,
})
