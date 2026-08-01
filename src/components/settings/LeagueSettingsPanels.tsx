import { ChoicePanel } from "./ChoicePanel"
import { ColumnsPanel } from "./ColumnsPanel"
import { InitialValuesPanel } from "./InitialValuesPanel"
import { WeightPanel } from "./WeightPanel"
import {
  matchingAlgorithmOptions,
  pauseModeOptions,
  settingsWithColumns,
  sortByOptions,
} from "@/lib/settings-view"
import type {
  MatchingAlgorithm,
  PauseMode,
  Settings,
  TableColumn,
} from "@/lib/types"
import {
  settings_algorithm,
  settings_algorithm_description,
  settings_next_round_hint,
  settings_pause_tie,
  settings_pause_tie_description,
  settings_sort_by,
  settings_table_overview_hint,
} from "@/paraglide/messages.js"

export type LeagueSettingsPanelId =
  "algorithm" | "weight" | "pauseMode" | "initialValues" | "columns" | "sortBy"

interface LeagueSettingsPanelsProps {
  openPanel: LeagueSettingsPanelId | null
  onOpenChange: (open: boolean) => void
  settings: Settings
  saving: boolean
  onSave: (settings: Settings, onSuccess?: () => void) => void
}

export function LeagueSettingsPanels({
  openPanel,
  onOpenChange,
  settings,
  saving,
  onSave,
}: LeagueSettingsPanelsProps) {
  const { table } = settings

  return (
    <>
      <ChoicePanel<MatchingAlgorithm>
        open={openPanel === "algorithm"}
        onOpenChange={onOpenChange}
        title={settings_algorithm()}
        description={settings_algorithm_description()}
        value={settings.matchingAlgorithm}
        options={matchingAlgorithmOptions()}
        onSelect={(matchingAlgorithm) =>
          onSave({ ...settings, matchingAlgorithm })
        }
        hint={settings_next_round_hint()}
      />

      <WeightPanel
        open={openPanel === "weight"}
        onOpenChange={onOpenChange}
        weight={settings.higherRatingWeight}
        onSave={(higherRatingWeight) =>
          onSave({ ...settings, higherRatingWeight })
        }
      />

      <InitialValuesPanel
        open={openPanel === "initialValues"}
        onOpenChange={onOpenChange}
        initialRating={settings.initialRating}
        initialRd={settings.initialRd}
        saving={saving}
        onSave={(initialValues) =>
          onSave({ ...settings, ...initialValues }, () => onOpenChange(false))
        }
      />

      <ChoicePanel<PauseMode>
        open={openPanel === "pauseMode"}
        onOpenChange={onOpenChange}
        title={settings_pause_tie()}
        description={settings_pause_tie_description()}
        value={settings.pauseMode}
        options={pauseModeOptions()}
        onSelect={(pauseMode) => onSave({ ...settings, pauseMode })}
        hint={settings_next_round_hint()}
      />

      <ColumnsPanel
        open={openPanel === "columns"}
        onOpenChange={onOpenChange}
        columns={table.columns}
        onChange={(columns) => onSave(settingsWithColumns(settings, columns))}
      />

      <ChoicePanel<TableColumn>
        open={openPanel === "sortBy"}
        onOpenChange={onOpenChange}
        title={settings_sort_by()}
        description={settings_table_overview_hint()}
        value={table.sortBy}
        options={sortByOptions(table.columns)}
        onSelect={(sortBy) =>
          onSave({ ...settings, table: { ...table, sortBy } })
        }
      />
    </>
  )
}
