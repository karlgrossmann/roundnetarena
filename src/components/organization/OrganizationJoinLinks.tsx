import { useState } from "react"
import type { FormEvent } from "react"
import { IconCopy, IconLink } from "@/components/icons"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { OrganizationJoinLinkList } from "./OrganizationJoinLinkList"
import { OrganizationMutationError } from "./OrganizationMutationError"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import {
  createOrganizationJoinLink,
  revokeOrganizationJoinLink,
} from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import {
  ORGANIZATION_JOIN_LINK_DEFAULT_DAYS,
  ORGANIZATION_JOIN_LINK_DEFAULT_MAX_USES,
  ORGANIZATION_JOIN_LINK_MAX_DAYS,
  ORGANIZATION_JOIN_LINK_MAX_USES,
} from "@/lib/organization-join-links"
import type { OrganizationJoinLink } from "@/lib/types"
import {
  organization_join_link_action_error,
  organization_join_link_copied,
  organization_join_link_copy,
  organization_join_link_create,
  organization_join_link_created,
  organization_join_link_creating,
  organization_join_link_days,
  organization_join_link_max_uses,
  organization_join_links,
  organization_join_links_description,
} from "@/paraglide/messages.js"

interface OrganizationJoinLinksProps {
  organizationId: string
  links: Array<OrganizationJoinLink>
}

export function OrganizationJoinLinks({
  organizationId,
  links,
}: OrganizationJoinLinksProps) {
  const queryClient = useQueryClient()
  const [expiresInDays, setExpiresInDays] = useState(
    ORGANIZATION_JOIN_LINK_DEFAULT_DAYS
  )
  const [maxUses, setMaxUses] = useState(
    ORGANIZATION_JOIN_LINK_DEFAULT_MAX_USES
  )
  const [copied, setCopied] = useState(false)
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization(organizationId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizationAuditRoot(organizationId),
      }),
    ])
  const create = useMutation({
    mutationFn: () =>
      createOrganizationJoinLink({
        organizationId,
        expiresInDays,
        maxUses,
      }),
    onSuccess: async () => {
      setCopied(false)
      await refresh()
    },
  })
  const revoke = useMutation({
    mutationFn: (joinLinkId: string) =>
      revokeOrganizationJoinLink(organizationId, joinLinkId),
    onSuccess: refresh,
  })
  const error = create.error ?? revoke.error

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    create.mutate()
  }

  async function copyCreatedLink() {
    if (!create.data) return
    await navigator.clipboard.writeText(create.data.url)
    setCopied(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{organization_join_links()}</CardTitle>
        <CardDescription>
          {organization_join_links_description()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        <form
          className="grid gap-3 px-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={submit}
        >
          <Field>
            <FieldLabel htmlFor="join-link-days">
              {organization_join_link_days()}
            </FieldLabel>
            <Input
              id="join-link-days"
              type="number"
              min={1}
              max={ORGANIZATION_JOIN_LINK_MAX_DAYS}
              value={expiresInDays}
              required
              onChange={(event) => setExpiresInDays(event.target.valueAsNumber)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="join-link-max-uses">
              {organization_join_link_max_uses()}
            </FieldLabel>
            <Input
              id="join-link-max-uses"
              type="number"
              min={1}
              max={ORGANIZATION_JOIN_LINK_MAX_USES}
              value={maxUses}
              required
              onChange={(event) => setMaxUses(event.target.valueAsNumber)}
            />
          </Field>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending
              ? organization_join_link_creating()
              : organization_join_link_create()}
          </Button>
        </form>

        {create.data ? (
          <div className="px-4">
            <Alert>
              <IconLink />
              <AlertTitle>{organization_join_link_created()}</AlertTitle>
              <AlertDescription className="mt-2 flex gap-2">
                <Input readOnly value={create.data.url} />
                <Button
                  type="button"
                  variant="outline"
                  aria-label={organization_join_link_copy()}
                  onClick={() => void copyCreatedLink()}
                >
                  <IconCopy />
                  {copied
                    ? organization_join_link_copied()
                    : organization_join_link_copy()}
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : null}

        {error ? (
          <div className="px-4">
            <OrganizationMutationError
              error={error}
              fallback={organization_join_link_action_error()}
            />
          </div>
        ) : null}

        <OrganizationJoinLinkList
          links={links}
          pending={revoke.isPending}
          onRevoke={(joinLinkId) => revoke.mutate(joinLinkId)}
        />
      </CardContent>
    </Card>
  )
}
