import { useId, useState } from "react"
import type { FormEvent } from "react"
import { IconTrophy } from "@/components/icons"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"

import { useLeagueContext } from "./LeagueContext"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createLeague } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import { domainIssueFromError } from "@/lib/domain-errors"
import { translateDomainIssue } from "@/lib/i18n"
import {
  league_create,
  league_create_description,
  league_create_error,
  league_create_pending,
  league_name,
  league_name_description,
} from "@/paraglide/messages.js"

export function CreateLeagueForm() {
  const id = useId()
  const league = useLeagueContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const create = useMutation({
    mutationFn: () => createLeague(league.organizationId, name),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.leagues(league.organizationId),
      })
      await navigate({
        to: "/o/$organizationSlug/l/$leagueId",
        params: {
          organizationSlug: created.organizationSlug,
          leagueId: created.id,
        },
      })
    },
  })
  const issue = create.isError ? domainIssueFromError(create.error) : null

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim().length >= 2) create.mutate()
  }

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTrophy />
          {league_create()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <p className="text-sm text-muted-foreground">
            {league_create_description({
              organization: league.organizationName,
            })}
          </p>
          <Field>
            <FieldLabel htmlFor={id}>{league_name()}</FieldLabel>
            <Input
              id={id}
              value={name}
              maxLength={100}
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
            <FieldDescription>{league_name_description()}</FieldDescription>
          </Field>
          {create.isError ? (
            <Alert variant="destructive">
              <AlertTitle>{league_create_error()}</AlertTitle>
              <AlertDescription>
                {issue ? translateDomainIssue(issue) : league_create_error()}
              </AlertDescription>
            </Alert>
          ) : null}
          <Button
            type="submit"
            disabled={name.trim().length < 2 || create.isPending}
          >
            {create.isPending ? league_create_pending() : league_create()}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
