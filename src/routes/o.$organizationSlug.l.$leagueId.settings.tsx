import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteError } from "@/components/RouteError"
import { SettingsSkeleton } from "@/components/settings/SettingsSkeleton"
import { SettingsView } from "@/components/settings/SettingsView"
import {
  accountQueryOptions,
  organizationQueryOptions,
  settingsQueryOptions,
} from "@/lib/api/queries"
import { ensureLeagueRouteContext } from "@/lib/api/league-route"
import { localizedRouteHead } from "@/lib/i18n"
import { settingsSearchSchema } from "@/lib/settings-tabs"
import { route_error_settings } from "@/paraglide/messages.js"

export const Route = createFileRoute(
  "/o/$organizationSlug/l/$leagueId/settings"
)({
  validateSearch: settingsSearchSchema,
  loaderDeps: ({ search }) => ({ tab: search.tab }),
  staticData: { titleKey: "settings" },
  head: () => localizedRouteHead("settings"),
  loader: async ({ context, deps, params }) => {
    const leaguePromise = ensureLeagueRouteContext(context.queryClient, params)

    if (deps.tab === "account") {
      await Promise.all([
        leaguePromise,
        context.queryClient.ensureQueryData(accountQueryOptions()),
      ])
      return
    }

    const league = await leaguePromise
    if (deps.tab === "organization") {
      await context.queryClient.ensureQueryData(
        organizationQueryOptions(league.organizationId)
      )
      return
    }
    await context.queryClient.ensureQueryData(settingsQueryOptions(league))
  },
  pendingComponent: SettingsPending,
  errorComponent: SettingsError,
  component: SettingsPage,
})

function SettingsPage() {
  const navigate = Route.useNavigate()
  const { tab } = Route.useSearch()

  return (
    <SettingsView
      tab={tab}
      onTabChange={(nextTab) => {
        void navigate({
          search: (previous) => ({ ...previous, tab: nextTab }),
        })
      }}
    />
  )
}

function SettingsPending() {
  const { tab } = Route.useSearch()
  return <SettingsSkeleton tab={tab} />
}

function SettingsError({ reset }: ErrorComponentProps) {
  return <RouteError description={route_error_settings()} reset={reset} />
}
