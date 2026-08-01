import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { InvitationAcceptance } from "@/components/organization/InvitationAcceptance"
import { localizedRouteHead } from "@/lib/i18n"

export const Route = createFileRoute("/accept-invitation")({
  validateSearch: z.object({ id: z.string().optional() }),
  staticData: { titleKey: "acceptInvitation" },
  head: () => localizedRouteHead("acceptInvitation"),
  component: InvitationPage,
})

function InvitationPage() {
  const { id } = Route.useSearch()
  return <InvitationAcceptance invitationId={id} />
}
