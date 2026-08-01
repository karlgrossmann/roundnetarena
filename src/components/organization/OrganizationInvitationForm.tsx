import { useState } from "react"
import type { FormEvent } from "react"

import {
  organizationRoleItems,
  organizationRoleLabel,
} from "./OrganizationRoleBadge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { assignableOrganizationRoles } from "@/lib/organization-permissions"
import type { OrganizationRole } from "@/lib/types"
import {
  organization_invitation_email,
  organization_invitation_pending,
  organization_invitation_role,
  organization_invitation_submit,
} from "@/paraglide/messages.js"

interface OrganizationInvitationFormProps {
  actorRole: OrganizationRole
  pending: boolean
  onInvite: (email: string, role: OrganizationRole) => void
}

export function OrganizationInvitationForm({
  actorRole,
  pending,
  onInvite,
}: OrganizationInvitationFormProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<OrganizationRole>("manager")

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onInvite(email, role)
    setEmail("")
  }

  return (
    <form onSubmit={submit}>
      <FieldGroup className="sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Field>
          <FieldLabel htmlFor="invitation-email">
            {organization_invitation_email()}
          </FieldLabel>
          <Input
            id="invitation-email"
            type="email"
            autoComplete="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>{organization_invitation_role()}</FieldLabel>
          <Select
            items={organizationRoleItems()}
            value={role}
            onValueChange={(value) => setRole(value as OrganizationRole)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignableOrganizationRoles(actorRole).map((option) => (
                <SelectItem key={option} value={option}>
                  {organizationRoleLabel(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button type="submit" disabled={pending}>
          {pending
            ? organization_invitation_pending()
            : organization_invitation_submit()}
        </Button>
      </FieldGroup>
    </form>
  )
}
