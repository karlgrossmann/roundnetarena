import { IconDots } from "@/components/icons"

import { AppBarMenu } from "./AppBarMenu"
import { LanguageMenuItems } from "@/components/language/LanguageMenuItems"
import { ThemeMenuItems } from "@/components/theme/ThemeMenuItems"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { nav_menu } from "@/paraglide/messages.js"

/** Language and theme on login and the access prompt — the same menu as elsewhere,
 *  minus the entries that require a signed-in user. */
export function AnonymousMenu() {
  return (
    <AppBarMenu icon={IconDots} label={nav_menu()}>
      <LanguageMenuItems />
      <DropdownMenuSeparator />
      <ThemeMenuItems />
    </AppBarMenu>
  )
}
