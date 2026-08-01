import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { OrganizationMutationError } from "./OrganizationMutationError"
import { OrganizationPublicViewPasswordForm } from "./OrganizationPublicViewPasswordForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { updateOrganizationPublicView } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import type { OrganizationPublicViewSettings } from "@/lib/types"
import {
  organization_public_view_access_path,
  organization_public_view_change_password,
  organization_public_view_copied,
  organization_public_view_copy,
  organization_public_view_description,
  organization_public_view_disable,
  organization_public_view_disabled,
  organization_public_view_enabled,
  organization_public_view_error,
  organization_public_view_title,
} from "@/paraglide/messages.js"

export function OrganizationPublicViewCard({
  organizationId,
  settings,
}: {
  organizationId: string
  settings: OrganizationPublicViewSettings
}) {
  const queryClient = useQueryClient()
  const [editingPassword, setEditingPassword] = useState(!settings.enabled)
  const [copied, setCopied] = useState(false)
  const mutation = useMutation({
    mutationFn: (
      input: { action: "enable"; password: string } | { action: "disable" }
    ) => updateOrganizationPublicView(organizationId, input),
    onSuccess: (details) => {
      queryClient.setQueryData(queryKeys.organization(organizationId), details)
      setEditingPassword(!(details.publicView?.enabled ?? false))
    },
  })

  async function copyAccessUrl() {
    const url = `${window.location.origin}${settings.accessPath}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>{organization_public_view_title()}</CardTitle>
            <CardDescription>
              {organization_public_view_description()}
            </CardDescription>
          </div>
          <Badge variant={settings.enabled ? "default" : "secondary"}>
            {settings.enabled
              ? organization_public_view_enabled()
              : organization_public_view_disabled()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {settings.enabled ? (
          <Field>
            <FieldLabel htmlFor="organization-public-view-url">
              {organization_public_view_access_path()}
            </FieldLabel>
            <div className="flex gap-2">
              <Input
                id="organization-public-view-url"
                value={settings.accessPath}
                readOnly
              />
              <Button type="button" variant="outline" onClick={copyAccessUrl}>
                {copied
                  ? organization_public_view_copied()
                  : organization_public_view_copy()}
              </Button>
            </div>
          </Field>
        ) : null}

        {editingPassword ? (
          <OrganizationPublicViewPasswordForm
            enabled={settings.enabled}
            saving={mutation.isPending}
            onCancel={() => setEditingPassword(false)}
            onSave={(password) =>
              mutation.mutate({ action: "enable", password })
            }
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPassword(true)}
            >
              {organization_public_view_change_password()}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ action: "disable" })}
            >
              {organization_public_view_disable()}
            </Button>
          </div>
        )}

        {mutation.isError ? (
          <OrganizationMutationError
            error={mutation.error}
            fallback={organization_public_view_error()}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
