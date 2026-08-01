import { useState } from "react"
import { IconChevronDown } from "@/components/icons"

import { RatingDelta } from "@/components/RatingDelta"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { formatRatingChange } from "@/lib/format"
import type { RatingChange } from "@/lib/types"
import { cn } from "@/lib/utils"
import { playerRefDisplayName } from "@/lib/player-display"
import { round_changes_all, round_changes_less } from "@/paraglide/messages.js"

interface RatingChangeListProps {
  /** Already sorted — the order is decided by `committedRatingChanges()`. */
  changes: Array<RatingChange>
}

/** Twelve rows would fill a phone, and the biggest movements are on top anyway. */
const VISIBLE_BY_DEFAULT = 5

export function RatingChangeList({ changes }: RatingChangeListProps) {
  const [expanded, setExpanded] = useState(false)

  const visible = changes.slice(0, VISIBLE_BY_DEFAULT)
  const hidden = changes.slice(VISIBLE_BY_DEFAULT)

  return (
    <div>
      <ul className="divide-y">
        {visible.map((change) => (
          <ChangeRow key={change.player.id} change={change} />
        ))}
      </ul>

      {hidden.length > 0 && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleContent>
            <ul className="divide-y border-t">
              {hidden.map((change) => (
                <ChangeRow key={change.player.id} change={change} />
              ))}
            </ul>
          </CollapsibleContent>

          <CollapsibleTrigger
            render={
              <Button variant="ghost" size="sm" className="mt-1 w-full" />
            }
          >
            <IconChevronDown
              className={cn("transition-transform", expanded && "rotate-180")}
            />
            {expanded
              ? round_changes_less()
              : round_changes_all({ count: changes.length })}
          </CollapsibleTrigger>
        </Collapsible>
      )}
    </div>
  )
}

function ChangeRow({ change }: { change: RatingChange }) {
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {playerRefDisplayName(change.player)}
        </span>
        <span className="block text-xs text-muted-foreground tabular-nums">
          {formatRatingChange(change.ratingBefore, change.ratingAfter)}
        </span>
      </span>

      {/* No `preview`: these values are scored and appear this way in the history. */}
      <RatingDelta delta={change.delta} />
    </li>
  )
}
