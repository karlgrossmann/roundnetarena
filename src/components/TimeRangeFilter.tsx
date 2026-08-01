import { useId, useState } from "react"
import { IconCalendar } from "@/components/icons"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatDateRange } from "@/lib/format"
import { isCustomTimeRange, validateCustomTimeRange } from "@/lib/time-range"
import { translateDomainIssue } from "@/lib/i18n"
import type {
  TimeRange,
  TimeRangeOption,
  TimeRangePreset,
} from "@/lib/time-range"
import {
  time_range_apply,
  time_range_custom,
  time_range_custom_description,
  time_range_from,
  time_range_label,
  time_range_to,
} from "@/paraglide/messages.js"

interface TimeRangeFilterProps {
  value: TimeRange
  options: ReadonlyArray<TimeRangeOption>
  onChange: (range: TimeRange) => void
  /** Screen reader label — without it the group is just "4W, 6M, All". */
  label?: string
  size?: "default" | "sm"
}

/** Quick filters plus a free from/to range, evaluated inclusively. */
export function TimeRangeFilter({
  value,
  options,
  onChange,
  label = time_range_label(),
  size = "default",
}: TimeRangeFilterProps) {
  const fieldId = useId()
  const selectedCustom = isCustomTimeRange(value) ? value : null
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(selectedCustom?.from ?? "")
  const [to, setTo] = useState(selectedCustom?.to ?? "")
  const [error, setError] = useState<string | null>(null)

  function applyCustomRange() {
    const result = validateCustomTimeRange(from, to)
    if (!result.valid) {
      setError(translateDomainIssue(result.issue))
      return
    }

    setError(null)
    onChange(result.range)
    setOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        aria-label={label}
        variant="outline"
        size={size}
        spacing={0}
        value={selectedCustom ? [] : [value as TimeRangePreset]}
        onValueChange={(next) => {
          const [selected] = next
          if (selected) onChange(selected as TimeRangePreset)
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant={selectedCustom ? "default" : "outline"}
              size={size}
            />
          }
        >
          <IconCalendar />
          {selectedCustom
            ? formatDateRange(selectedCustom)
            : time_range_label()}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <PopoverHeader>
            <PopoverTitle>{time_range_custom()}</PopoverTitle>
            <PopoverDescription>
              {time_range_custom_description()}
            </PopoverDescription>
          </PopoverHeader>

          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              applyCustomRange()
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor={`${fieldId}-from`}>
                  {time_range_from()}
                </FieldLabel>
                <Input
                  id={`${fieldId}-from`}
                  type="date"
                  value={from}
                  aria-invalid={error ? true : undefined}
                  onChange={(event) => {
                    setFrom(event.target.value)
                    setError(null)
                  }}
                />
              </Field>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel htmlFor={`${fieldId}-to`}>
                  {time_range_to()}
                </FieldLabel>
                <Input
                  id={`${fieldId}-to`}
                  type="date"
                  value={to}
                  aria-invalid={error ? true : undefined}
                  onChange={(event) => {
                    setTo(event.target.value)
                    setError(null)
                  }}
                />
              </Field>
            </div>

            <FieldError>{error}</FieldError>
            <Button type="submit">{time_range_apply()}</Button>
          </form>
        </PopoverContent>
      </Popover>
    </div>
  )
}
