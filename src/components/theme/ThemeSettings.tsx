import { useState } from "react"

import { useTheme } from "./ThemeProvider"
import { THEMES } from "./theme"
import { themeLabel } from "./theme-labels"
import { ChoicePanel } from "@/components/settings/ChoicePanel"
import { SettingsGroup } from "@/components/settings/SettingsGroup"
import { SettingsRow } from "@/components/settings/SettingsRow"
import { theme_settings_description } from "@/paraglide/messages/theme_settings_description.js"
import { theme_settings_group } from "@/paraglide/messages/theme_settings_group.js"
import { theme_settings_label } from "@/paraglide/messages/theme_settings_label.js"
import { theme_settings_panel_description } from "@/paraglide/messages/theme_settings_panel_description.js"

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <>
      <SettingsGroup label={theme_settings_group()}>
        <SettingsRow
          label={theme_settings_label()}
          description={theme_settings_description()}
          value={themeLabel(theme)}
          onOpen={() => setOpen(true)}
        />
      </SettingsGroup>

      <ChoicePanel
        open={open}
        onOpenChange={setOpen}
        title={theme_settings_label()}
        description={theme_settings_panel_description()}
        value={theme}
        options={THEMES.map((option) => ({
          value: option,
          label: themeLabel(option),
        }))}
        onSelect={setTheme}
      />
    </>
  )
}
