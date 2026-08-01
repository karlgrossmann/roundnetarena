import { useState } from "react"
import type { FormEvent } from "react"
import { useMutation } from "@tanstack/react-query"

import { AnonymousMenu } from "@/components/layout/AnonymousMenu"
import { Shell } from "@/components/layout/Shell"
import { OrganizationLogo } from "@/components/organization/OrganizationLogo"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authenticatePublicView } from "@/lib/api/mutations"
import { domainIssueFromError } from "@/lib/domain-errors"
import { translateDomainIssue } from "@/lib/i18n"
import { safePublicViewRedirect } from "@/lib/public-view"
import type { PublicViewEntry } from "@/lib/types"
import {
  public_view_access_description,
  public_view_access_title,
  public_view_invalid_password,
  public_view_open,
  public_view_opening,
  public_view_password,
  public_view_unavailable,
} from "@/paraglide/messages.js"

export function PublicViewAccess({
  entry,
  redirect,
}: {
  entry: PublicViewEntry
  redirect?: string
}) {
  const [password, setPassword] = useState("")
  const mutation = useMutation({
    mutationFn: () => authenticatePublicView(entry.organizationSlug, password),
    onSuccess: () => {
      const destination =
        safePublicViewRedirect(entry.organizationSlug, redirect) ??
        `/view/${encodeURIComponent(entry.organizationSlug)}/l/${encodeURIComponent(entry.defaultLeagueId)}`
      window.location.assign(destination)
    },
  })
  const issue = mutation.isError ? domainIssueFromError(mutation.error) : null

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <Shell variant="centered" actions={<AnonymousMenu />}>
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <OrganizationLogo
            name={entry.organizationName}
            logo={entry.organizationLogo}
            className="size-16"
          />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {entry.organizationName}
            </p>
            <CardTitle>{public_view_access_title()}</CardTitle>
          </div>
          <CardDescription>{public_view_access_description()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup>
              <Field data-invalid={mutation.isError || undefined}>
                <FieldLabel htmlFor="public-view-password">
                  {public_view_password()}
                </FieldLabel>
                <Input
                  id="public-view-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  required
                  disabled={mutation.isPending}
                  aria-invalid={mutation.isError}
                  onChange={(event) => setPassword(event.target.value)}
                />
                {issue ? (
                  <FieldError>{translateDomainIssue(issue)}</FieldError>
                ) : mutation.isError ? (
                  <FieldError>{public_view_invalid_password()}</FieldError>
                ) : null}
              </Field>
              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending
                  ? public_view_opening()
                  : public_view_open()}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </Shell>
  )
}

export function PublicViewUnavailable() {
  return (
    <Shell variant="centered" actions={<AnonymousMenu />}>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{public_view_access_title()}</CardTitle>
          <CardDescription>{public_view_unavailable()}</CardDescription>
        </CardHeader>
      </Card>
    </Shell>
  )
}
