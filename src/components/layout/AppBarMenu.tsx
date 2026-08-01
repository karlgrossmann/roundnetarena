import type { ComponentType, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * The trigger of the header bar's right-hand group — exactly one per bar.
 *
 * A row of single icon buttons — previously four in the public view, in three different
 * sizes — reads as a collection rather than a group and crowds 56 px of height on the
 * phone. Everything rare therefore moves into this menu; only the trigger stays visible
 * and keeps its 44 px for the thumb.
 */
export function AppBarMenu({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  children: ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        render={
          <Button
            variant="ghost"
            size="icon"
            className="-mr-1.5 size-11 md:size-9"
          />
        }
      >
        <Icon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
