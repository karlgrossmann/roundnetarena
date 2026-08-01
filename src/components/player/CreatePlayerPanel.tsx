import { useId, useState } from "react"
import type { FormEvent } from "react"
import { IconChevronDown } from "@/components/icons"
import { Link } from "@tanstack/react-router"

import { ResponsivePanel } from "@/components/layout/ResponsivePanel"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { useLeagueContext } from "@/components/league/LeagueContext"
import { Input } from "@/components/ui/input"
import { useCreatePlayer } from "@/hooks/use-create-player"
import {
  hasErrors,
  toCreatePlayerInput,
  validateNewPlayer,
} from "@/lib/player-form"
import { translateDomainIssue } from "@/lib/i18n"
import {
  INITIAL_RATING_MAX,
  INITIAL_RATING_MIN,
  INITIAL_RD_MAX,
  INITIAL_RD_MIN,
} from "@/lib/rating-defaults"
import type { NewPlayerDraft, NewPlayerErrors } from "@/lib/player-form"
import type { Player, PlayerId } from "@/lib/types"
import {
  common_cancel,
  player_advanced,
  player_create,
  player_create_description,
  player_create_error,
  player_create_pending,
  player_create_submit,
  player_first_name,
  player_initial_rating,
  player_initial_rating_description,
  player_initial_rd,
  player_initial_rd_description,
  player_last_name,
  player_name_conflict,
  player_open_existing,
} from "@/paraglide/messages.js"

interface CreatePlayerPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Defaults from the settings — normally nobody touches them. */
  initialRating: number
  initialRd: number
  /** Panel heading. From the pool it reads "Gast anlegen". */
  title?: string
  description?: string
  /** Runs after a successful creation. The pool uses it to add the new player right
   *  away instead of making someone search for them. */
  onCreated?: (player: Player) => void
}

function emptyDraft(rating: number, rd: number): NewPlayerDraft {
  return {
    firstName: "",
    lastName: "",
    rating: String(rating),
    rd: String(rd),
  }
}

export function CreatePlayerPanel({
  open,
  onOpenChange,
  initialRating,
  initialRd,
  title = player_create(),
  description = player_create_description(),
  onCreated,
}: CreatePlayerPanelProps) {
  const league = useLeagueContext()
  const id = useId()
  const createPlayer = useCreatePlayer()
  const [draft, setDraft] = useState<NewPlayerDraft>(() =>
    emptyDraft(initialRating, initialRd)
  )
  const [errors, setErrors] = useState<NewPlayerErrors>({})
  const [conflictingPlayerId, setConflictingPlayerId] =
    useState<PlayerId | null>(null)

  function update(field: keyof NewPlayerDraft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }))
    if (field === "firstName" || field === "lastName") {
      setConflictingPlayerId(null)
    }
  }

  function reset() {
    setDraft(emptyDraft(initialRating, initialRd))
    setErrors({})
    setConflictingPlayerId(null)
    createPlayer.reset()
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const found = validateNewPlayer(draft)
    setErrors(found)
    if (hasErrors(found)) return

    createPlayer.mutate(toCreatePlayerInput(draft), {
      onSuccess: (result) => {
        if (result.status === "conflict") {
          setConflictingPlayerId(result.error.existingPlayerId)
          return
        }
        onCreated?.(result.player)
        reset()
        onOpenChange(false)
      },
    })
  }

  return (
    <ResponsivePanel
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
    >
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          <Field data-invalid={errors.firstName !== undefined}>
            <FieldLabel htmlFor={`${id}-first-name`}>
              {player_first_name()}
            </FieldLabel>
            <Input
              id={`${id}-first-name`}
              value={draft.firstName}
              autoComplete="given-name"
              aria-invalid={errors.firstName !== undefined}
              onChange={(event) => update("firstName", event.target.value)}
            />
            <FieldError>
              {errors.firstName
                ? translateDomainIssue(errors.firstName)
                : undefined}
            </FieldError>
          </Field>

          <Field data-invalid={errors.lastName !== undefined}>
            <FieldLabel htmlFor={`${id}-last-name`}>
              {player_last_name()}
            </FieldLabel>
            <Input
              id={`${id}-last-name`}
              value={draft.lastName}
              autoComplete="family-name"
              aria-invalid={errors.lastName !== undefined}
              onChange={(event) => update("lastName", event.target.value)}
            />
            <FieldError>
              {errors.lastName
                ? translateDomainIssue(errors.lastName)
                : undefined}
            </FieldError>
          </Field>

          {conflictingPlayerId ? (
            <p role="alert" className="text-sm text-destructive">
              {player_name_conflict()}{" "}
              <Link
                to="/o/$organizationSlug/l/$leagueId/player/$playerId"
                params={{
                  organizationSlug: league.organizationSlug,
                  leagueId: league.id,
                  playerId: conflictingPlayerId,
                }}
                className="font-medium underline underline-offset-4"
              >
                {player_open_existing()}
              </Link>
            </p>
          ) : null}

          <Collapsible>
            <CollapsibleTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="group/advanced -ml-2.5"
                />
              }
            >
              <IconChevronDown className="transition-transform group-data-[panel-open]/advanced:rotate-180" />
              {player_advanced()}
            </CollapsibleTrigger>

            <CollapsibleContent className="pt-4">
              <FieldGroup>
                <Field data-invalid={errors.rating !== undefined}>
                  <FieldLabel htmlFor={`${id}-rating`}>
                    {player_initial_rating()}
                  </FieldLabel>
                  <Input
                    id={`${id}-rating`}
                    type="number"
                    inputMode="numeric"
                    min={INITIAL_RATING_MIN}
                    max={INITIAL_RATING_MAX}
                    step={1}
                    value={draft.rating}
                    aria-invalid={errors.rating !== undefined}
                    onChange={(event) => update("rating", event.target.value)}
                  />
                  <FieldDescription>
                    {player_initial_rating_description()}
                  </FieldDescription>
                  <FieldError>
                    {errors.rating
                      ? translateDomainIssue(errors.rating)
                      : undefined}
                  </FieldError>
                </Field>

                <Field data-invalid={errors.rd !== undefined}>
                  <FieldLabel htmlFor={`${id}-rd`}>
                    {player_initial_rd()}
                  </FieldLabel>
                  <Input
                    id={`${id}-rd`}
                    type="number"
                    inputMode="decimal"
                    min={INITIAL_RD_MIN}
                    max={INITIAL_RD_MAX}
                    step="any"
                    value={draft.rd}
                    aria-invalid={errors.rd !== undefined}
                    onChange={(event) => update("rd", event.target.value)}
                  />
                  <FieldDescription>
                    {player_initial_rd_description()}
                  </FieldDescription>
                  <FieldError>
                    {errors.rd ? translateDomainIssue(errors.rd) : undefined}
                  </FieldError>
                </Field>
              </FieldGroup>
            </CollapsibleContent>
          </Collapsible>

          {createPlayer.isError && (
            <p role="alert" className="text-sm text-destructive">
              {player_create_error()}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {common_cancel()}
            </Button>
            <Button type="submit" disabled={createPlayer.isPending}>
              {createPlayer.isPending
                ? player_create_pending()
                : player_create_submit()}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </ResponsivePanel>
  )
}
