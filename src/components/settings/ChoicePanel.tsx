import { useId } from "react"

import { ResponsivePanel } from "@/components/layout/ResponsivePanel"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export interface Choice<TValue extends string> {
  value: TValue
  label: string
  description?: string
  disabled?: boolean
}

interface ChoicePanelProps<TValue extends string> {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  value: TValue
  options: ReadonlyArray<Choice<TValue>>
  onSelect: (value: TValue) => void
  /** Note at the bottom of the panel, e.g. when a change takes effect. */
  hint?: string
}

/**
 * Picks one value out of a handful of options.
 *
 * Selecting closes the panel right away — a save button for a single value would be
 * one step too many.
 */
export function ChoicePanel<TValue extends string>({
  open,
  onOpenChange,
  title,
  description,
  value,
  options,
  onSelect,
  hint,
}: ChoicePanelProps<TValue>) {
  const groupId = useId()

  return (
    <ResponsivePanel
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <FieldGroup>
        <RadioGroup
          value={value}
          onValueChange={(next) => {
            onSelect(next as TValue)
            onOpenChange(false)
          }}
        >
          {options.map((option) => {
            const id = `${groupId}-${option.value}`

            return (
              <FieldLabel key={option.value} htmlFor={id}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>{option.label}</FieldTitle>
                    {option.description ? (
                      <FieldDescription>{option.description}</FieldDescription>
                    ) : null}
                  </FieldContent>
                  <RadioGroupItem
                    id={id}
                    value={option.value}
                    disabled={option.disabled}
                  />
                </Field>
              </FieldLabel>
            )
          })}
        </RadioGroup>

        {hint ? <FieldDescription>{hint}</FieldDescription> : null}
      </FieldGroup>
    </ResponsivePanel>
  )
}
