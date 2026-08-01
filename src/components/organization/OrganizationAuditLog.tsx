import { useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { OrganizationRoleBadge } from "./OrganizationRoleBadge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatGameMoment } from "@/lib/format"
import { organizationAuditQueryOptions } from "@/lib/api/queries"
import type { OrganizationAuditEntry } from "@/lib/types"
import { useNow } from "@/hooks/use-now"
import {
  organization_audit_actor_removed,
  organization_audit_description,
  organization_audit_empty,
  organization_audit_error,
  organization_audit_event_invitation_accepted,
  organization_audit_event_invitation_created,
  organization_audit_event_invitation_resent,
  organization_audit_event_invitation_revoked,
  organization_audit_event_join_link_accepted,
  organization_audit_event_join_link_created,
  organization_audit_event_join_link_revoked,
  organization_audit_event_member_removed,
  organization_audit_event_member_role_changed,
  organization_audit_event_organization_archived,
  organization_audit_event_ownership_changed,
  organization_audit_event_public_view_disabled,
  organization_audit_event_public_view_enabled,
  organization_audit_event_public_view_password_changed,
  organization_audit_loading,
  organization_audit_next,
  organization_audit_page,
  organization_audit_previous,
  organization_audit_retry,
  organization_audit_title,
} from "@/paraglide/messages.js"

export function OrganizationAuditLog({
  organizationId,
}: {
  organizationId: string
}) {
  const [page, setPage] = useState(1)
  const now = useNow()
  const audit = useQuery({
    ...organizationAuditQueryOptions(organizationId, page),
    placeholderData: keepPreviousData,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{organization_audit_title()}</CardTitle>
        <CardDescription>{organization_audit_description()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {audit.isPending ? (
          <p className="text-sm text-muted-foreground">
            {organization_audit_loading()}
          </p>
        ) : audit.isError ? (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">
              {organization_audit_error()}
            </p>
            <Button variant="outline" size="sm" onClick={() => audit.refetch()}>
              {organization_audit_retry()}
            </Button>
          </div>
        ) : audit.data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {organization_audit_empty()}
          </p>
        ) : (
          <>
            <ol className="divide-y border-y">
              {audit.data.items.map((entry) => (
                <li key={entry.id} className="space-y-1 py-3">
                  <p className="font-medium">
                    {organizationAuditEventLabel(entry)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {now ? formatGameMoment(entry.createdAt, now) : "\u00a0"}
                  </p>
                </li>
              ))}
            </ol>
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || audit.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {organization_audit_previous()}
              </Button>
              <span className="text-sm text-muted-foreground">
                {organization_audit_page({
                  page: audit.data.page,
                  total: audit.data.totalPages,
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= audit.data.totalPages || audit.isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                {organization_audit_next()}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function organizationAuditEventLabel(
  entry: OrganizationAuditEntry
): React.ReactNode {
  const actor = entry.actor?.name ?? organization_audit_actor_removed()
  const metadata = entry.metadata

  switch (entry.eventType) {
    case "organization.member_role_changed":
      if (!("previousRole" in metadata) || !("newRole" in metadata)) return null
      return (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          {organization_audit_event_member_role_changed({ actor })}
          <OrganizationRoleBadge role={metadata.previousRole} />
          <span aria-hidden>→</span>
          <OrganizationRoleBadge role={metadata.newRole} />
        </span>
      )
    case "organization.ownership_changed":
      return organization_audit_event_ownership_changed({ actor })
    case "organization.member_removed":
      return organization_audit_event_member_removed({ actor })
    case "organization.invitation_created":
      return organization_audit_event_invitation_created({ actor })
    case "organization.invitation_resent":
      return organization_audit_event_invitation_resent({ actor })
    case "organization.invitation_revoked":
      return organization_audit_event_invitation_revoked({ actor })
    case "organization.invitation_accepted":
      return organization_audit_event_invitation_accepted({ actor })
    case "organization.join_link_created":
      return organization_audit_event_join_link_created({ actor })
    case "organization.join_link_revoked":
      return organization_audit_event_join_link_revoked({ actor })
    case "organization.join_link_accepted":
      return organization_audit_event_join_link_accepted({ actor })
    case "organization.public_view_enabled":
      return organization_audit_event_public_view_enabled({ actor })
    case "organization.public_view_disabled":
      return organization_audit_event_public_view_disabled({ actor })
    case "organization.public_view_password_changed":
      return organization_audit_event_public_view_password_changed({ actor })
    case "organization.archived":
      return organization_audit_event_organization_archived({ actor })
  }
}
