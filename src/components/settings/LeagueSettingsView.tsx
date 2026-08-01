import { useState } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"

import { LeagueSettingsPanels } from "./LeagueSettingsPanels"
import type { LeagueSettingsPanelId } from "./LeagueSettingsPanels"
import { SettingsGroup } from "./SettingsGroup"
import { SettingsRow } from "./SettingsRow"
import { useLeagueContext } from "@/components/league/LeagueContext"
import { Switch } from "@/components/ui/switch"
import { useSaveSettings } from "@/hooks/use-save-settings"
import { settingsQueryOptions } from "@/lib/api/queries"
import { formatRating, formatRd, formatWeight } from "@/lib/format"
import { columnLabel } from "@/lib/leaderboard"
import {
  matchingAlgorithmLabel,
  pauseModeLabel,
  visibleColumnsSummary,
} from "@/lib/settings-view"
import {
  settings_algorithm,
  settings_algorithm_description,
  settings_color_change,
  settings_color_change_description,
  settings_initial_rd_description,
  settings_initial_rating_description,
  settings_matching,
  settings_new_players,
  settings_notice,
  settings_pause_tie,
  settings_pause_tie_description,
  settings_pauses,
  settings_sort_by,
  settings_table,
  settings_visible_columns,
  settings_weight,
  settings_weight_description,
  player_initial_rating,
  player_initial_rd,
} from "@/paraglide/messages.js"

/**
 * Settings of the currently selected league. The data is already cached — the loader
 * only fetches it while the league tab is active.
 */
export function LeagueSettingsView() {
  const league = useLeagueContext()
  const { data: settings } = useSuspenseQuery(settingsQueryOptions(league))

  const [openPanel, setOpenPanel] = useState<LeagueSettingsPanelId | null>(null)
  const save = useSaveSettings()

  const { table } = settings

  function closePanel(open: boolean) {
    if (!open) setOpenPanel(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsGroup label={settings_matching()}>
        <SettingsRow
          label={settings_algorithm()}
          description={settings_algorithm_description()}
          value={matchingAlgorithmLabel(settings.matchingAlgorithm)}
          onOpen={() => setOpenPanel("algorithm")}
        />
        <SettingsRow
          label={settings_weight()}
          description={settings_weight_description()}
          value={formatWeight(settings.higherRatingWeight)}
          onOpen={() => setOpenPanel("weight")}
        />
      </SettingsGroup>

      <SettingsGroup label={settings_pauses()}>
        <SettingsRow
          label={settings_pause_tie()}
          description={settings_pause_tie_description()}
          value={pauseModeLabel(settings.pauseMode)}
          onOpen={() => setOpenPanel("pauseMode")}
        />
      </SettingsGroup>

      <SettingsGroup label={settings_new_players()}>
        <SettingsRow
          label={player_initial_rating()}
          description={settings_initial_rating_description()}
          value={formatRating(settings.initialRating)}
          onOpen={() => setOpenPanel("initialValues")}
        />
        <SettingsRow
          label={player_initial_rd()}
          description={settings_initial_rd_description()}
          value={formatRd(settings.initialRd)}
          onOpen={() => setOpenPanel("initialValues")}
        />
      </SettingsGroup>

      <SettingsGroup label={settings_table()}>
        <SettingsRow
          label={settings_visible_columns()}
          description={visibleColumnsSummary(table.columns)}
          value={String(table.columns.length)}
          onOpen={() => setOpenPanel("columns")}
        />
        <SettingsRow
          label={settings_sort_by()}
          value={columnLabel(table.sortBy)}
          onOpen={() => setOpenPanel("sortBy")}
        />
        <SettingsRow
          label={settings_color_change()}
          description={settings_color_change_description()}
          control={
            <Switch
              aria-label={settings_color_change()}
              checked={table.colorRatingChange}
              onCheckedChange={(checked) =>
                save.mutate({
                  ...settings,
                  table: { ...table, colorRatingChange: checked },
                })
              }
            />
          }
        />
      </SettingsGroup>

      <p className="text-sm text-muted-foreground">{settings_notice()}</p>

      <LeagueSettingsPanels
        openPanel={openPanel}
        onOpenChange={closePanel}
        settings={settings}
        saving={save.isPending}
        onSave={(next, onSuccess) =>
          save.mutate(next, onSuccess ? { onSuccess } : undefined)
        }
      />
    </div>
  )
}
