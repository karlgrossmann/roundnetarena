import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import {
  PublicViewAccess,
  PublicViewUnavailable,
} from "@/components/public-view/PublicViewAccess"
import { publicViewEntryQueryOptions } from "@/lib/api/queries"
import { documentTitle } from "@/lib/brand"
import { public_view_access_title } from "@/paraglide/messages.js"

export const Route = createFileRoute("/view/$organizationSlug/")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: documentTitle(public_view_access_title()) },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      publicViewEntryQueryOptions(params.organizationSlug)
    ),
  errorComponent: PublicViewUnavailable,
  component: PublicViewEntryPage,
})

function PublicViewEntryPage() {
  const { organizationSlug } = Route.useParams()
  const { redirect } = Route.useSearch()
  const { data: entry } = useSuspenseQuery(
    publicViewEntryQueryOptions(organizationSlug)
  )
  return <PublicViewAccess entry={entry} redirect={redirect} />
}
