import { useState } from "react"
import { IconPencil } from "@/components/icons"

import { EditPlayerPanel } from "./EditPlayerPanel"
import { Button } from "@/components/ui/button"
import type { Player } from "@/lib/types"
import { player_edit } from "@/paraglide/messages.js"

/**
 * Button plus the panel behind it. Each opening remounts the panel so the form starts
 * from the player as they are now, not from an earlier, discarded draft.
 */
export function EditPlayerButton({ player }: { player: Player }) {
  const [open, setOpen] = useState(false)
  const [openings, setOpenings] = useState(0)

  return (
    <>
      <Button
        variant="outline"
        className="w-full md:w-auto"
        onClick={() => {
          setOpenings((count) => count + 1)
          setOpen(true)
        }}
      >
        <IconPencil />
        {player_edit()}
      </Button>

      <EditPlayerPanel
        key={openings}
        player={player}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
