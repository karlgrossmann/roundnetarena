import { IconClockPause } from "@/components/icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/format"
import type { IsoDateTime } from "@/lib/types"
import {
  pool_keep,
  pool_restart,
  pool_stale_question,
  pool_stale_title,
} from "@/paraglide/messages.js"

interface StalePoolNoticeProps {
  updatedAt: IsoDateTime
  /** Keep the pool — the notice disappears, the selection stays. */
  onKeep: () => void
  /** Start over — the pool is cleared. */
  onRestart: () => void
}

/**
 * Asks back about a pool untouched for more than three hours.
 *
 * Without it you accidentally start with yesterday's lineup — and only notice once the
 * matchups are set.
 */
export function StalePoolNotice({
  updatedAt,
  onKeep,
  onRestart,
}: StalePoolNoticeProps) {
  return (
    <Alert>
      <IconClockPause />
      <AlertTitle>
        {pool_stale_title({ time: formatTime(updatedAt) })}
      </AlertTitle>
      <AlertDescription>
        <p>{pool_stale_question()}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onKeep}>
            {pool_keep()}
          </Button>
          <Button variant="ghost" size="sm" onClick={onRestart}>
            {pool_restart()}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
