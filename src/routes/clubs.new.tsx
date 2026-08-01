import { createFileRoute } from "@tanstack/react-router"

import { CreateOrganizationForm } from "@/components/organization/CreateOrganizationForm"
import { localizedRouteHead } from "@/lib/i18n"

export const Route = createFileRoute("/clubs/new")({
  staticData: { titleKey: "createOrganization", backTo: "/clubs" },
  head: () => localizedRouteHead("createOrganization"),
  component: CreateOrganizationForm,
})
