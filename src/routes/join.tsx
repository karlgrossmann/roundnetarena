import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { JoinLinkAcceptance } from "@/components/organization/JoinLinkAcceptance"
import { organizationJoinLinkQueryOptions } from "@/lib/api/queries"
import { localizedRouteHead } from "@/lib/i18n"

export const Route = createFileRoute("/join")({
  validateSearch: z.object({ token: z.string().optional() }),
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ context, deps }) => {
    if (!deps.token) return
    await context.queryClient.ensureQueryData(
      organizationJoinLinkQueryOptions(deps.token)
    )
  },
  staticData: { titleKey: "joinOrganization" },
  head: () => {
    const localized = localizedRouteHead("joinOrganization")
    return {
      ...localized,
      meta: [...localized.meta, { name: "referrer", content: "no-referrer" }],
    }
  },
  component: JoinOrganizationPage,
})

function JoinOrganizationPage() {
  const { token } = Route.useSearch()
  return <JoinLinkAcceptance token={token} />
}
