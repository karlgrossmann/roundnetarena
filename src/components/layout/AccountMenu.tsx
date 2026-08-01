import { IconLogout, IconSettings, IconUserCircle } from "@/components/icons"
import { Link, useNavigate } from "@tanstack/react-router"

import { AppBarMenu } from "./AppBarMenu"
import { LanguageMenuItems } from "@/components/language/LanguageMenuItems"
import { LeagueMenu } from "@/components/league/LeagueMenu"
import { OrganizationMenu } from "@/components/organization/OrganizationMenu"
import { ThemeMenuItems } from "@/components/theme/ThemeMenuItems"
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { authClient } from "@/lib/auth-client"
import { pageTitle } from "@/lib/i18n"
import { account_menu_label, auth_sign_out } from "@/paraglide/messages.js"
import type { NavParams } from "./navigation"

/**
 * Everything that isn't needed constantly: organization, league, settings, language,
 * theme and sign out.
 *
 * Settings live here rather than in the main navigation — they are barely opened during
 * a session day and would have taken up one of the thumb slots there.
 */
export function AccountMenu({
  leagueParams,
}: {
  leagueParams: NavParams | null
}) {
  const navigate = useNavigate()

  async function signOut() {
    await authClient.signOut()
    await navigate({ to: "/login", replace: true })
  }

  return (
    <AppBarMenu icon={IconUserCircle} label={account_menu_label()}>
      <OrganizationMenu />
      <LeagueMenu />
      {leagueParams ? (
        <DropdownMenuItem
          render={
            <Link
              to="/o/$organizationSlug/l/$leagueId/settings"
              params={leagueParams}
            />
          }
        >
          <IconSettings />
          {pageTitle("settings")}
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuSeparator />
      <LanguageMenuItems />
      <DropdownMenuSeparator />
      <ThemeMenuItems />
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => void signOut()}>
        <IconLogout />
        {auth_sign_out()}
      </DropdownMenuItem>
    </AppBarMenu>
  )
}
