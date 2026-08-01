import { useId, useState } from "react"
import type { FormEvent } from "react"

import { ResponsivePanel } from "@/components/layout/ResponsivePanel"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { translateDomainIssue } from "@/lib/i18n"
import {
  INITIAL_RATING_MAX,
  INITIAL_RATING_MIN,
  INITIAL_RD_MAX,
  INITIAL_RD_MIN,
  hasInitialValueErrors,
  parseLocalizedNumber,
  validateInitialValues,
} from "@/lib/rating-defaults"
import type {
  InitialValuesDraft,
  InitialValuesErrors,
} from "@/lib/rating-defaults"
import {
  common_cancel,
  common_save,
  common_saving,
  player_initial_rating,
  player_initial_rd,
  settings_initial_rating_help,
  settings_initial_rd_help,
  settings_initial_values_description,
  settings_initial_values_title,
} from "@/paraglide/messages.js"

interface InitialValuesPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRating: number
  initialRd: number
  saving: boolean
  onSave: (values: { initialRating: number; initialRd: number }) => void
}

export function InitialValuesPanel({
  open,
  onOpenChange,
  initialRating,
  initialRd,
  saving,
  onSave,
}: InitialValuesPanelProps) {
  return (
    <ResponsivePanel
      open={open}
      onOpenChange={onOpenChange}
      title={settings_initial_values_title()}
      description={settings_initial_values_description()}
    >
      <InitialValuesForm
        key={`${initialRating}-${initialRd}-${open}`}
        initialRating={initialRating}
        initialRd={initialRd}
        saving={saving}
        onCancel={() => onOpenChange(false)}
        onSave={onSave}
      />
    </ResponsivePanel>
  )
}

interface InitialValuesFormProps {
  initialRating: number
  initialRd: number
  saving: boolean
  onCancel: () => void
  onSave: (values: { initialRating: number; initialRd: number }) => void
}

function InitialValuesForm({
  initialRating,
  initialRd,
  saving,
  onCancel,
  onSave,
}: InitialValuesFormProps) {
  const id = useId()
  const [draft, setDraft] = useState<InitialValuesDraft>({
    initialRating: String(initialRating),
    initialRd: String(initialRd),
  })
  const [errors, setErrors] = useState<InitialValuesErrors>({})

  function update(field: keyof InitialValuesDraft, value: string) {
    setDraft((previous) => ({ ...previous, [field]: value }))
    setErrors((previous) => ({ ...previous, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const found = validateInitialValues(draft)
    setErrors(found)
    if (hasInitialValueErrors(found)) return

    const nextRating = parseLocalizedNumber(draft.initialRating)
    const nextRd = parseLocalizedNumber(draft.initialRd)
    if (nextRating === null || nextRd === null) return
    onSave({ initialRating: nextRating, initialRd: nextRd })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.initialRating !== undefined}>
          <FieldLabel htmlFor={`${id}-initial-rating`}>
            {player_initial_rating()}
          </FieldLabel>
          <Input
            id={`${id}-initial-rating`}
            type="number"
            inputMode="numeric"
            min={INITIAL_RATING_MIN}
            max={INITIAL_RATING_MAX}
            step={1}
            value={draft.initialRating}
            aria-invalid={errors.initialRating !== undefined}
            onChange={(event) => update("initialRating", event.target.value)}
          />
          <FieldDescription>{settings_initial_rating_help()}</FieldDescription>
          <FieldError>
            {errors.initialRating
              ? translateDomainIssue(errors.initialRating)
              : undefined}
          </FieldError>
        </Field>

        <Field data-invalid={errors.initialRd !== undefined}>
          <FieldLabel htmlFor={`${id}-initial-rd`}>
            {player_initial_rd()}
          </FieldLabel>
          <Input
            id={`${id}-initial-rd`}
            type="number"
            inputMode="numeric"
            min={INITIAL_RD_MIN}
            max={INITIAL_RD_MAX}
            step={1}
            value={draft.initialRd}
            aria-invalid={errors.initialRd !== undefined}
            onChange={(event) => update("initialRd", event.target.value)}
          />
          <FieldDescription>{settings_initial_rd_help()}</FieldDescription>
          <FieldError>
            {errors.initialRd
              ? translateDomainIssue(errors.initialRd)
              : undefined}
          </FieldError>
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            {common_cancel()}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? common_saving() : common_save()}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
