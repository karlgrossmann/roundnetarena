import { IconPlayerPause } from "@/components/icons"

import { Card, CardContent } from "@/components/ui/card"
import { pausingSummary } from "@/lib/round-view"
import type { PausingPlayer } from "@/lib/types"
import { round_pausing_title } from "@/paraglide/messages.js"

/** Who sits out this round. Muted, not red: pausing is not an error state. */
export function PausingCard({ pausing }: { pausing: Array<PausingPlayer> }) {
  if (pausing.length === 0) return null

  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <IconPlayerPause
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{round_pausing_title()}</p>
          <p className="text-sm text-muted-foreground">
            {pausingSummary(pausing)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
