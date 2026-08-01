import { createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"

import { RouteError } from "@/components/RouteError"
import { OrganizationList } from "@/components/organization/OrganizationList"
import { OrganizationsSkeleton } from "@/components/organization/OrganizationsSkeleton"
import { organizationsQueryOptions } from "@/lib/api/queries"
import { localizedRouteHead } from "@/lib/i18n"
import { route_error_organizations } from "@/paraglide/messages.js"

export const Route = createFileRoute("/clubs/")({
  staticData: { titleKey: "organizations" },
  head: () => localizedRouteHead("organizations"),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(organizationsQueryOptions()),
  pendingComponent: OrganizationsSkeleton,
  errorComponent: OrganizationsError,
  component: OrganizationList,
})

function OrganizationsError({ reset }: ErrorComponentProps) {
  return <RouteError description={route_error_organizations()} reset={reset} />
}
