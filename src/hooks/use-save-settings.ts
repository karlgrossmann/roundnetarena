import { useMutation, useQueryClient } from "@tanstack/react-query"

import { useLeagueContext } from "@/components/league/LeagueContext"
import { saveSettings } from "@/lib/api/mutations"
import { queryKeys } from "@/lib/api/queries"
import { toast } from "@/components/ui/toast"
import type { Settings } from "@/lib/types"
import {
  settings_save_error_description,
  settings_save_error_title,
} from "@/paraglide/messages.js"

/**
 * Saves the settings.
 *
 * The cache is written only after the response, not optimistically: if saving fails the
 * old value stays and the toast explains why nothing changed. A setting that flips and
 * then falls back would be worse than one that flips a moment later.
 */
export function useSaveSettings() {
  const queryClient = useQueryClient()
  const league = useLeagueContext()

  return useMutation({
    mutationFn: (settings: Settings) => saveSettings(league, settings),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings(league), settings)
    },
    onError: () => {
      toast.add({
        type: "error",
        title: settings_save_error_title(),
        description: settings_save_error_description(),
      })
    },
  })
}
