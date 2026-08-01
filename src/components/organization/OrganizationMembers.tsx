import { useMutation, useQueryClient } from "@tanstack/react-query"

import { OrganizationMemberRow } from "./OrganizationMemberRow"
import { OrganizationMutationError } from "./OrganizationMutationError"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  removeOrganizationMember,
  updateOrganizationMemberRole,
} from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import type { OrganizationMember, OrganizationRole } from "@/lib/types"
import {
  organization_member_action_error,
  organization_members,
  organization_members_description,
} from "@/paraglide/messages.js"

interface OrganizationMembersProps {
  organizationId: string
  actorRole: OrganizationRole
  members: Array<OrganizationMember>
}

export function OrganizationMembers({
  organizationId,
  actorRole,
  members,
}: OrganizationMembersProps) {
  const queryClient = useQueryClient()
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization(organizationId),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizationAuditRoot(organizationId),
      }),
    ])
  }
  const updateRole = useMutation({
    mutationFn: updateOrganizationMemberRole,
    onSuccess: refresh,
  })
  const removeMember = useMutation({
    mutationFn: (memberId: string) =>
      removeOrganizationMember(organizationId, memberId),
    onSuccess: refresh,
  })
  const error = updateRole.error ?? removeMember.error
  const pending = updateRole.isPending || removeMember.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>{organization_members()}</CardTitle>
        <CardDescription>{organization_members_description()}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {error ? (
          <div className="px-4 pb-3">
            <OrganizationMutationError
              error={error}
              fallback={organization_member_action_error()}
            />
          </div>
        ) : null}
        <ul className="divide-y">
          {members.map((member) => (
            <OrganizationMemberRow
              key={member.id}
              actorRole={actorRole}
              member={member}
              pending={pending}
              onRoleChange={(memberId, role) =>
                updateRole.mutate({ organizationId, memberId, role })
              }
              onRemove={(memberId) => removeMember.mutate(memberId)}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
