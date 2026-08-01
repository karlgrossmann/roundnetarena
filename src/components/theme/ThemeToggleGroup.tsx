import { ThemeIcon } from "./ThemeIcon"
import { useTheme } from "./ThemeProvider"
import { THEMES, isTheme } from "./theme"
import { themeLabel } from "./theme-labels"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { theme_settings_label } from "@/paraglide/messages/theme_settings_label.js"

/** Color scheme as a compact toggle group — for pages without an account menu, such as
 *  sign-in. All three options are visible at once, so the buttons carry only their icon
 *  and the name as `aria-label` and tooltip. */
export function ThemeToggleGroup({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <ToggleGroup
      value={[theme]}
      onValueChange={([next]) => {
        // Clicking the active option again yields an empty array — the color
        // scheme then simply stays as it is.
        if (isTheme(next)) setTheme(next)
      }}
      spacing={0.5}
      aria-label={theme_settings_label()}
      className={cn(
        "h-9 rounded-full border border-input bg-transparent p-1 dark:bg-input/30",
        className
      )}
    >
      {THEMES.map((option) => (
        <ToggleGroupItem
          key={option}
          value={option}
          size="sm"
          aria-label={themeLabel(option)}
          title={themeLabel(option)}
          className="size-7 rounded-full px-0 text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
        >
          <ThemeIcon theme={option} className="size-4" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
