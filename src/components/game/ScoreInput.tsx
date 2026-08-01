import { IconMinus, IconPlus } from "@/components/icons"
import type { ChangeEvent, KeyboardEvent, RefObject } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  score_decrease,
  score_increase,
  score_points,
  score_team_names,
} from "@/paraglide/messages.js"

interface ScoreInputProps {
  id: string
  names: Array<string>
  value: string
  onChange: (next: string) => void
  invalid?: boolean
  /** Currently leading — highlighted so the two sides don't get mixed up. */
  leading?: boolean
  ref?: RefObject<HTMLInputElement | null>
  /** Fires once two digits have been **typed** — not when the buttons step the value
   *  there. Someone still stepping is not done yet. */
  onFilled?: () => void
}

/** A two-digit score is complete — roundnet needs nothing beyond that. */
const COMPLETE_SCORE = /^\d{2}$/

/**
 * Points of one team.
 *
 * **A number field, not just a stepper.** Plus and minus alone would mean 38 taps for
 * 21:17. So the number is typed, and the two buttons below cover the common one-point
 * correction. Both paths are at least 44 px tall — this is operated courtside, standing.
 *
 * **The buttons are outside the tab order.** Whoever types wants to go field to field
 * and on to save, not through four stepper buttons. Arrow up and down take over the same
 * job directly in the field, so nothing is lost for keyboard users.
 */
export function ScoreInput({
  id,
  names,
  value,
  onChange,
  invalid = false,
  leading = false,
  ref,
  onFilled,
}: ScoreInputProps) {
  const team = score_team_names({
    first: names[0] ?? "",
    second: names[1] ?? "",
  })
  const parsed = Number.parseInt(value, 10)
  const current = Number.isNaN(parsed) ? 0 : parsed

  function step(by: number) {
    onChange(String(Math.max(current + by, 0)))
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value
    onChange(next)
    if (COMPLETE_SCORE.test(next)) onFilled?.()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
    // Otherwise the caret jumps to the start or end of the field.
    event.preventDefault()
    step(event.key === "ArrowUp" ? 1 : -1)
  }

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center gap-2 rounded-xl border p-3 transition-colors",
        leading ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <span className="flex flex-col items-center text-center text-xs leading-tight text-muted-foreground">
        {names.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </span>

      <Input
        id={id}
        ref={ref}
        inputMode="numeric"
        autoComplete="off"
        aria-label={score_points({ team })}
        aria-invalid={invalid}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="h-14 text-center font-heading text-3xl tabular-nums md:text-3xl"
      />

      <div className="flex w-full gap-2">
        <Button
          type="button"
          variant="outline"
          tabIndex={-1}
          className="h-11 flex-1"
          aria-label={score_decrease({ team })}
          onClick={() => step(-1)}
        >
          <IconMinus />
        </Button>

        <Button
          type="button"
          variant="outline"
          tabIndex={-1}
          className="h-11 flex-1"
          aria-label={score_increase({ team })}
          onClick={() => step(1)}
        >
          <IconPlus />
        </Button>
      </div>
    </div>
  )
}
