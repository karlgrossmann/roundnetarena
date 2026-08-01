import { z } from "zod"

export const SETTINGS_TABS = ["account", "organization", "league"] as const

export type SettingsTab = (typeof SETTINGS_TABS)[number]

export const settingsSearchSchema = z.object({
  tab: z.enum(SETTINGS_TABS).catch("account").default("account"),
})
