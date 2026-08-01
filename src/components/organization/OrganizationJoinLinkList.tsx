import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCalendarDay } from "@/lib/format"
import type { OrganizationJoinLink } from "@/lib/types"
import {
  organization_join_link_empty,
  organization_join_link_expires,
  organization_join_link_revoke,
  organization_join_link_status_active,
  organization_join_link_status_exhausted,
  organization_join_link_status_expired,
  organization_join_link_status_revoked,
  organization_join_link_usage,
} from "@/paraglide/messages.js"

interface OrganizationJoinLinkListProps {
  links: Array<OrganizationJoinLink>
  pending: boolean
  onRevoke: (joinLinkId: string) => void
}

export function OrganizationJoinLinkList({
  links,
  pending,
  onRevoke,
}: OrganizationJoinLinkListProps) {
  if (links.length === 0) {
    return (
      <p className="px-4 text-sm text-muted-foreground">
        {organization_join_link_empty()}
      </p>
    )
  }

  return (
    <ul className="divide-y border-t">
      {links.map((link) => (
        <li
          key={link.id}
          className="flex flex-wrap items-center gap-3 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={link.status === "active" ? "default" : "outline"}>
                {joinLinkStatusLabel(link.status)}
              </Badge>
              <span className="text-sm">
                {organization_join_link_usage({
                  used: link.usedCount,
                  maximum: link.maxUses,
                })}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {organization_join_link_expires({
                date: formatCalendarDay(link.expiresAt),
              })}
            </p>
          </div>
          {link.status === "active" ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onRevoke(link.id)}
            >
              {organization_join_link_revoke()}
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function joinLinkStatusLabel(status: OrganizationJoinLink["status"]): string {
  switch (status) {
    case "active":
      return organization_join_link_status_active()
    case "expired":
      return organization_join_link_status_expired()
    case "exhausted":
      return organization_join_link_status_exhausted()
    case "revoked":
      return organization_join_link_status_revoked()
  }
}
