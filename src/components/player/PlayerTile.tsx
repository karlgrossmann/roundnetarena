import { IconCheck, IconPlayerPause } from "@/components/icons"
import { cva } from "class-variance-authority"

import { formatRating } from "@/lib/format"
import { nextPoolStatus } from "@/lib/round"
import { playerRefDisplayName } from "@/lib/player-display"
import type { PlayerRef, PoolStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  pool_status_absent,
  pool_status_paused,
  pool_status_playing,
} from "@/paraglide/messages.js"

interface PlayerTileProps {
  player: PlayerRef
  status: PoolStatus
  onToggle: (next: PoolStatus) => void
  disabled?: boolean
}

const tileVariants = cva(
  "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      status: {
        playing: "border-primary bg-primary/10 text-foreground",
        // Dashed and muted, not red: pausing is not an error state.
        paused: "border-dashed border-border text-muted-foreground",
        absent: "border-border text-muted-foreground hover:bg-muted/50",
      },
    },
  }
)

const markVariants = cva(
  "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors [&_svg]:size-3.5",
  {
    variants: {
      status: {
        playing: "border-primary bg-primary text-primary-foreground",
        paused:
          "border-dashed border-muted-foreground/60 text-muted-foreground",
        absent: "border-border",
      },
    },
  }
)

/**
 * Tile in the pool. One tap advances the state: absent → playing → paused.
 *
 * No context menu and no long press — courtside a single tap has to do, and the target
 * is at least 44 px tall so it can be hit while standing.
 */
export function PlayerTile({
  player,
  status,
  onToggle,
  disabled,
}: PlayerTileProps) {
  const statusLabel: Record<PoolStatus, string> = {
    playing: pool_status_playing(),
    paused: pool_status_paused(),
    absent: pool_status_absent(),
  }

  return (
    <button
      type="button"
      // Three states, but only two values: "pressed" means "is here today". The exact
      // state is carried by the text at the end of the label.
      aria-pressed={status !== "absent"}
      disabled={disabled}
      onClick={() => onToggle(nextPoolStatus(status))}
      className={cn(tileVariants({ status }))}
    >
      <span aria-hidden className={cn(markVariants({ status }))}>
        {status === "playing" && <IconCheck strokeWidth={3} />}
        {status === "paused" && <IconPlayerPause />}
      </span>

      <span className="flex min-w-0 flex-col">
        <span
          className={cn(
            "truncate text-sm leading-tight font-medium",
            status === "playing" && "text-foreground"
          )}
        >
          {playerRefDisplayName(player)}
        </span>
        <span className="text-xs leading-tight text-muted-foreground tabular-nums">
          {status === "paused"
            ? pool_status_paused()
            : formatRating(player.rating)}
        </span>
      </span>

      {/* When paused the state is already visible — don't announce it twice. */}
      {status !== "paused" && (
        <span className="sr-only">{statusLabel[status]}</span>
      )}
    </button>
  )
}
