import { useState } from "react"
import { IconBan, IconCircleX } from "@/components/icons"

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
  common_cancel,
  round_annul,
  round_annul_confirm,
  round_annul_description,
  round_annul_question,
  round_annulled,
  round_cancel_none,
  round_cancel_open,
  round_cancel_open_description,
  round_cancel_open_question,
} from "@/paraglide/messages.js"

interface RoundCancellationActionsProps {
  openGames: number
  alreadyAnnulled: boolean
  onCancelOpen: () => void
  onAnnul: () => void
  disabled?: boolean
}

type PendingAction = "open" | "all" | null

/**
 * Two deliberately separate ways out of a running round:
 *
 * - Cancelling the open games keeps already entered results in the scoring.
 * - Annulling the whole round takes those games out of the scoring too.
 *
 * Both need a confirmation because they affect several game cards at once.
 */
export function RoundCancellationActions({
  openGames,
  alreadyAnnulled,
  onCancelOpen,
  onAnnul,
  disabled = false,
}: RoundCancellationActionsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const cancelsOpenGames = pendingAction === "open"

  function confirm() {
    if (cancelsOpenGames) {
      onCancelOpen()
    } else if (pendingAction === "all") {
      onAnnul()
    }
    setPendingAction(null)
  }

  return (
    <>
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          disabled={disabled || openGames === 0}
          onClick={() => setPendingAction("open")}
        >
          <IconBan />
          {openGames === 0 ? round_cancel_none() : round_cancel_open()}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={disabled || alreadyAnnulled}
          onClick={() => setPendingAction("all")}
        >
          <IconCircleX />
          {alreadyAnnulled ? round_annulled() : round_annul()}
        </Button>
      </div>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              {cancelsOpenGames ? <IconBan /> : <IconCircleX />}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {cancelsOpenGames
                ? round_cancel_open_question()
                : round_annul_question()}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cancelsOpenGames
                ? round_cancel_open_description({ count: openGames })
                : round_annul_description()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{common_cancel()}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirm}>
              {cancelsOpenGames ? round_cancel_open() : round_annul_confirm()}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
