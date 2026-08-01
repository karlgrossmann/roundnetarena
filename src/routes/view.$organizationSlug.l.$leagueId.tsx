import { useSuspenseQuery } from "@tanstack/react-query"
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteError } from "@/components/RouteError"
import { PublicViewContextProvider } from "@/components/public-view/PublicViewContext"
import { PublicViewShell } from "@/components/public-view/PublicViewShell"
import { publicViewContextQueryOptions } from "@/lib/api/queries"
import { public_view_error } from "@/paraglide/messages.js"

export const Route = createFileRoute("/view/$organizationSlug/l/$leagueId")({
  loader: async ({ context, location, params }) => {
    try {
      return await context.queryClient.ensureQueryData(
        publicViewContextQueryOptions(params)
      )
    } catch (error) {
      if (
        !(error instanceof Error) ||
        error.message !== "public_view.unauthorized"
      ) {
        throw error
      }
      throw redirect({
        to: "/view/$organizationSlug",
        params: { organizationSlug: params.organizationSlug },
        search: { redirect: location.href },
      })
    }
  },
  errorComponent: PublicViewContextError,
  component: PublicViewLayout,
})

function PublicViewLayout() {
  const params = Route.useParams()
  const { data: view } = useSuspenseQuery(publicViewContextQueryOptions(params))
  return (
    <PublicViewContextProvider value={view}>
      <PublicViewShell>
        <Outlet />
      </PublicViewShell>
    </PublicViewContextProvider>
  )
}

function PublicViewContextError({ reset }: ErrorComponentProps) {
  return <RouteError description={public_view_error()} reset={reset} />
}
