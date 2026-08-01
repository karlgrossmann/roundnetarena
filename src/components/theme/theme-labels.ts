import { theme_dark } from "@/paraglide/messages/theme_dark.js"
import { theme_light } from "@/paraglide/messages/theme_light.js"
import { theme_system } from "@/paraglide/messages/theme_system.js"
import type { Theme } from "./theme"

export function themeLabel(theme: Theme): string {
  switch (theme) {
    case "system":
      return theme_system()
    case "light":
      return theme_light()
    case "dark":
      return theme_dark()
  }
}
