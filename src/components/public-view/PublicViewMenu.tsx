import { IconDots, IconLockOpenOff } from "@/components/icons"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { PublicLeagueMenu } from "./PublicLeagueMenu"
import { usePublicViewContext } from "./PublicViewContext"
import { LanguageMenuItems } from "@/components/language/LanguageMenuItems"
import { AppBarMenu } from "@/components/layout/AppBarMenu"
import { ThemeMenuItems } from "@/components/theme/ThemeMenuItems"
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { endPublicViewSession } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import { nav_menu, public_view_end_session } from "@/paraglide/messages.js"

/**
 * The public view's counterpart to the account menu: league, language, color scheme and
 * ending the session.
 */
export function PublicViewMenu() {
  const view = usePublicViewContext()
  const queryClient = useQueryClient()
  const endSession = useMutation({
    mutationFn: () => endPublicViewSession(view.organizationSlug),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: queryKeys.publicViewRoot(view.organizationSlug),
      })
      window.location.assign(
        `/view/${encodeURIComponent(view.organizationSlug)}`
      )
    },
  })

  return (
    <AppBarMenu icon={IconDots} label={nav_menu()}>
      <PublicLeagueMenu />
      <DropdownMenuSeparator />
      <LanguageMenuItems />
      <DropdownMenuSeparator />
      <ThemeMenuItems />
      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled={endSession.isPending}
        onClick={() => endSession.mutate()}
      >
        <IconLockOpenOff />
        {public_view_end_session()}
      </DropdownMenuItem>
    </AppBarMenu>
  )
}
