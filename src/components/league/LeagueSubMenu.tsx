import type { ReactNode } from "react"
import { IconCheck, IconTrophy } from "@/components/icons"
import { Link } from "@tanstack/react-router"
import type { LinkProps } from "@tanstack/react-router"

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { league_menu_label } from "@/paraglide/messages.js"

export interface LeagueSubMenuEntry {
  id: string
  name: string
  /** Only known for signed-in members — stays empty in the public view. */
  playerCount?: number
}

interface LeagueSubMenuProps {
  activeLeagueId: string
  activeName: string
  entries: ReadonlyArray<LeagueSubMenuEntry>
  /**
   * Target of an entry — `/o/…` for members, `/view/…` publicly.
   *
   * A function, because the router only type-checks `to` and `params` together; a path
   * as a plain string would bypass that check.
   */
  link: (leagueId: string) => LinkProps
  /** Extra entries at the bottom, such as creating a league. */
  footer?: ReactNode
}

/**
 * League switcher as an app bar submenu — identical for members and in the public view.
 * The data sources differ, the presentation does not.
 */
export function LeagueSubMenu({
  activeLeagueId,
  activeName,
  entries,
  link,
  footer,
}: LeagueSubMenuProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger aria-label={league_menu_label()}>
        <IconTrophy />
        <span className="min-w-0 flex-1 truncate">{activeName}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{league_menu_label()}</DropdownMenuLabel>
          {entries.map((entry) => (
            <DropdownMenuItem
              key={entry.id}
              render={<Link {...link(entry.id)} />}
            >
              <span className="min-w-0 flex-1 truncate">{entry.name}</span>
              {entry.playerCount === undefined ? null : (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {entry.playerCount}
                </span>
              )}
              {entry.id === activeLeagueId ? <IconCheck /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {footer}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
