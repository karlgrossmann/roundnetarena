import { useState } from "react"
import { IconTrash } from "@/components/icons"
import { useNavigate } from "@tanstack/react-router"

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
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useLeagueContext } from "@/components/league/LeagueContext"
import { useDeletePlayer } from "@/hooks/use-delete-player"
import { playerFullName, playerRemovalDescription } from "@/lib/player-view"
import type { PlayerRemoval } from "@/lib/player-removal"
import type { Player } from "@/lib/types"
import {
  common_cancel,
  player_delete,
  player_delete_question,
  player_remove,
  player_remove_confirm,
  player_remove_error,
  player_remove_question,
} from "@/paraglide/messages.js"

interface RemovePlayerCardProps {
  player: Player
  removal: PlayerRemoval
}

/**
 * Removing a player.
 *
 * Restrained at the end of the page: the action is rare and should not catch the eye.
 * The dialog names what actually happens — one button hides two different operations,
 * and a generic "really delete?" would conceal both.
 */
export function RemovePlayerCard({ player, removal }: RemovePlayerCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const navigate = useNavigate()
  const league = useLeagueContext()
  const deletePlayer = useDeletePlayer()

  const isDeletion = removal === "deleted"

  function remove() {
    deletePlayer.mutate(player, {
      onSuccess: () => {
        setConfirmOpen(false)
        void navigate({
          to: "/o/$organizationSlug/l/$leagueId",
          params: {
            organizationSlug: league.organizationSlug,
            leagueId: league.id,
          },
        })
      },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {deletePlayer.isError && (
        <Alert variant="destructive">
          <AlertTitle>
            {player_remove_error({ name: playerFullName(player) })}
          </AlertTitle>
        </Alert>
      )}

      <Button
        variant="outline"
        className="w-full text-destructive md:w-auto md:self-start"
        onClick={() => setConfirmOpen(true)}
      >
        <IconTrash />
        {player_remove()}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconTrash />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {isDeletion
                ? player_delete_question({ name: playerFullName(player) })
                : player_remove_question({ name: playerFullName(player) })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {playerRemovalDescription(player, removal)}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlayer.isPending}>
              {common_cancel()}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletePlayer.isPending}
              onClick={remove}
            >
              {isDeletion ? player_delete() : player_remove_confirm()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
