import { useState } from "react"
import { IconPlus } from "@/components/icons"

import { CreatePlayerPanel } from "./CreatePlayerPanel"
import { Button } from "@/components/ui/button"
import { player_create } from "@/paraglide/messages.js"

interface CreatePlayerButtonProps {
  /** Defaults for the panel, taken from the settings. */
  initialRating: number
  initialRd: number
  /** Below `sm` the button carries only the icon — space next to the search is tight. */
  labelClassName?: string
}

/**
 * Button plus the panel behind it.
 *
 * The open state belongs to the button, not to the surrounding page: that way the same
 * action can sit in several places — next to the table search and in the empty state —
 * without anyone having to thread the state through.
 */
export function CreatePlayerButton({
  initialRating,
  initialRd,
  labelClassName,
}: CreatePlayerButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* `aria-label` because the label can be hidden on narrow screens — the button's
          accessible name must not get lost with it. */}
      <Button
        variant="default"
        aria-label={player_create()}
        onClick={() => setOpen(true)}
      >
        <IconPlus />
        <span className={labelClassName}>{player_create()}</span>
      </Button>

      <CreatePlayerPanel
        open={open}
        onOpenChange={setOpen}
        initialRating={initialRating}
        initialRd={initialRd}
      />
    </>
  )
}
