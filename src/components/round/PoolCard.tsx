import { useState } from "react"
import { IconTrash, IconUserPlus } from "@/components/icons"

import { PlayerTile } from "@/components/player/PlayerTile"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { countPoolStatus, poolSummaryLabel, sortPoolEntries } from "@/lib/pool"
import type { PlayerRef, PoolEntry, PoolStatus } from "@/lib/types"
import {
  common_cancel,
  pool_add_all,
  pool_clear,
  pool_clear_description,
  pool_clear_question,
  pool_empty,
  pool_guest,
  pool_title,
} from "@/paraglide/messages.js"

interface PoolCardProps {
  /** Every player of the league with their status — including those absent today. */
  entries: Array<PoolEntry>
  onToggle: (player: PlayerRef, next: PoolStatus) => void
  onAddAll: () => void
  onClear: () => void
  onAddGuest: () => void
}

/**
 * "Who is here today?" — the grid the pool is assembled with.
 *
 * Deliberately lists every player of the league: whoever is missing is one tile away,
 * not a search away.
 */
export function PoolCard({
  entries,
  onToggle,
  onAddAll,
  onClear,
  onAddGuest,
}: PoolCardProps) {
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  const sorted = sortPoolEntries(entries)
  const counts = countPoolStatus(entries)
  const isEmpty = counts.playing === 0 && counts.paused === 0

  return (
    <Card className="gap-0">
      <CardHeader className="pb-(--card-spacing)">
        <CardTitle>{pool_title()}</CardTitle>
        <CardDescription>{poolSummaryLabel(counts)}</CardDescription>
      </CardHeader>

      <CardContent className="pb-(--card-spacing)">
        {isEmpty && (
          <p className="mb-3 text-sm text-muted-foreground">{pool_empty()}</p>
        )}

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {sorted.map((entry) => (
            <PlayerTile
              key={entry.player.id}
              player={entry.player}
              status={entry.status}
              onToggle={(next) => onToggle(entry.player, next)}
            />
          ))}
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button variant="ghost" size="sm" onClick={onAddAll}>
          {pool_add_all()}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={isEmpty}
          onClick={() => setConfirmClearOpen(true)}
        >
          {pool_clear()}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={onAddGuest}
        >
          <IconUserPlus />
          {pool_guest()}
        </Button>
      </CardFooter>

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconTrash />
            </AlertDialogMedia>
            <AlertDialogTitle>{pool_clear_question()}</AlertDialogTitle>
            <AlertDialogDescription>
              {pool_clear_description()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common_cancel()}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onClear()
                setConfirmClearOpen(false)
              }}
            >
              {pool_clear()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
