import { useId, useState } from "react"
import type { ComponentProps, FormEvent } from "react"
import { IconChevronDown } from "@/components/icons"

import { PlayerNameConflictNotice } from "./PlayerNameConflictNotice"
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
import { Input } from "@/components/ui/input"
import { useUpdatePlayer } from "@/hooks/use-update-player"
import { domainIssueFromError } from "@/lib/domain-errors"
import { translateDomainIssue } from "@/lib/i18n"
import {
  draftFromPlayer,
  hasErrors,
  toUpdatePlayerInput,
  validatePlayerEdit,
} from "@/lib/player-form"
import type { NewPlayerDraft, NewPlayerErrors } from "@/lib/player-form"
import {
  INITIAL_RATING_MAX,
  INITIAL_RATING_MIN,
  INITIAL_RD_MAX,
  INITIAL_RD_MIN,
} from "@/lib/rating-defaults"
import type { Player, PlayerId } from "@/lib/types"
import {
  common_cancel,
  player_advanced,
  player_edit,
  player_edit_description,
  player_edit_error,
  player_edit_pending,
  player_edit_submit,
  player_first_name,
  player_last_name,
  player_rating,
  player_rating_adjust_description,
  player_rd,
  player_rd_adjust_description,
} from "@/paraglide/messages.js"

interface EditPlayerPanelProps {
  player: Player
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Correcting a player's name or rating.
 *
 * The draft is taken from the player once, when the panel mounts — the button remounts
 * it on every opening, so it never shows stale values. Only changed numbers are sent:
 * every one of them is a rating correction that stays visible in the history.
 */
export function EditPlayerPanel({
  player,
  open,
  onOpenChange,
}: EditPlayerPanelProps) {
  const id = useId()
  const updatePlayer = useUpdatePlayer(player.id)
  const [original] = useState(() => draftFromPlayer(player))
  const [draft, setDraft] = useState<NewPlayerDraft>(original)
  const [errors, setErrors] = useState<NewPlayerErrors>({})
  const [conflictingPlayerId, setConflictingPlayerId] =
    useState<PlayerId | null>(null)

  function update(field: keyof NewPlayerDraft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }))
    if (field === "firstName" || field === "lastName") {
      setConflictingPlayerId(null)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const found = validatePlayerEdit(draft, original)
    setErrors(found)
    if (hasErrors(found)) return

    updatePlayer.mutate(toUpdatePlayerInput(draft, original), {
      onSuccess: (result) => {
        if (result.status === "conflict") {
          setConflictingPlayerId(result.error.existingPlayerId)
          return
        }
        onOpenChange(false)
      },
    })
  }

  const serverIssue = domainIssueFromError(updatePlayer.error)

  function draftField(
    name: keyof NewPlayerDraft,
    label: string,
    inputProps: ComponentProps<typeof Input>,
    description?: string
  ) {
    const issue = errors[name]
    return (
      <Field data-invalid={issue !== undefined}>
        <FieldLabel htmlFor={`${id}-${name}`}>{label}</FieldLabel>
        <Input
          id={`${id}-${name}`}
          value={draft[name]}
          aria-invalid={issue !== undefined}
          onChange={(event) => update(name, event.target.value)}
          {...inputProps}
        />
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
        <FieldError>
          {issue ? translateDomainIssue(issue) : undefined}
        </FieldError>
      </Field>
    )
  }

  return (
    <ResponsivePanel
      open={open}
      onOpenChange={onOpenChange}
      title={player_edit()}
      description={player_edit_description()}
    >
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          {draftField("firstName", player_first_name(), {
            autoComplete: "given-name",
          })}
          {draftField("lastName", player_last_name(), {
            autoComplete: "family-name",
          })}

          {conflictingPlayerId ? (
            <PlayerNameConflictNotice playerId={conflictingPlayerId} />
          ) : null}

          {draftField(
            "rating",
            player_rating(),
            {
              type: "number",
              inputMode: "numeric",
              min: INITIAL_RATING_MIN,
              max: INITIAL_RATING_MAX,
              step: 1,
            },
            player_rating_adjust_description()
          )}

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
              {draftField(
                "rd",
                player_rd(),
                {
                  type: "number",
                  inputMode: "decimal",
                  min: INITIAL_RD_MIN,
                  max: INITIAL_RD_MAX,
                  step: "any",
                },
                player_rd_adjust_description()
              )}
            </CollapsibleContent>
          </Collapsible>

          {updatePlayer.isError && (
            <p role="alert" className="text-sm text-destructive">
              {serverIssue
                ? translateDomainIssue(serverIssue)
                : player_edit_error()}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {common_cancel()}
            </Button>
            <Button type="submit" disabled={updatePlayer.isPending}>
              {updatePlayer.isPending
                ? player_edit_pending()
                : player_edit_submit()}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </ResponsivePanel>
  )
}
