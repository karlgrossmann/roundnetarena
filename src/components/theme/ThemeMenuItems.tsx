import { ThemeIcon } from "./ThemeIcon"
import { useTheme } from "./ThemeProvider"
import { THEMES, isTheme } from "./theme"
import { themeLabel } from "./theme-labels"
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { theme_settings_label } from "@/paraglide/messages/theme_settings_label.js"

/** Color scheme choice as a menu group — identical in the account menu and the public
 *  view. */
export function ThemeMenuItems() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenuRadioGroup
      value={theme}
      onValueChange={(value) => {
        if (isTheme(value)) setTheme(value)
      }}
    >
      <DropdownMenuLabel>{theme_settings_label()}</DropdownMenuLabel>
      {THEMES.map((option) => (
        <DropdownMenuRadioItem key={option} value={option}>
          <ThemeIcon theme={option} />
          {themeLabel(option)}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  )
}
