import { RatingValue } from "@/components/RatingValue"
import type { Team } from "@/lib/types"
import { playerRefDisplayName } from "@/lib/player-display"
import { cn } from "@/lib/utils"

interface TeamDisplayProps {
  team: Team
  /** `end` mirrors the team towards the centre so both sides face each other. */
  align?: "start" | "end"
  className?: string
}

export function TeamDisplay({
  team,
  align = "start",
  className,
}: TeamDisplayProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1",
        align === "end" && "items-end text-right",
        className
      )}
    >
      {team.players.map((player) => (
        <span key={player.id} className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-medium">
            {playerRefDisplayName(player)}
          </span>
          <RatingValue
            rating={player.rating}
            className="text-xs text-muted-foreground"
          />
        </span>
      ))}
    </div>
  )
}
