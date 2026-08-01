import { IconMinus, IconPlus } from "@/components/icons"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { courtsConsequenceLabel } from "@/lib/pool"
import {
  round_courts_label,
  round_courts_less,
  round_courts_more,
  round_courts_title,
} from "@/paraglide/messages.js"

interface CourtsCardProps {
  courts: number
  /** Highest number of courts that can be staffed — derived from the players. */
  max: number
  playingCount: number
  onChange: (courts: number) => void
}

/**
 * Number of nets played on at the same time.
 *
 * The stepper is the only place that changes the pause distribution, so its consequence
 * is shown right below it instead of only in the preview.
 */
export function CourtsCard({
  courts,
  max,
  playingCount,
  onChange,
}: CourtsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium">{round_courts_title()}</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {courtsConsequenceLabel(playingCount, courts)}
          </span>
        </div>

        <div
          role="group"
          aria-label={round_courts_label()}
          className="flex shrink-0 items-center gap-1"
        >
          <Button
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={round_courts_less()}
            disabled={courts <= 1}
            onClick={() => onChange(courts - 1)}
          >
            <IconMinus />
          </Button>

          {/* `aria-live` so the new number is announced without a focus change. */}
          <span
            aria-live="polite"
            className="w-8 text-center font-heading text-lg font-medium tabular-nums"
          >
            {courts}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={round_courts_more()}
            disabled={courts >= max}
            onClick={() => onChange(courts + 1)}
          >
            <IconPlus />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
