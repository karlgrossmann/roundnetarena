import {
  IconBuildingCommunity,
  IconTrophy,
  IconUserCircle,
} from "@/components/icons"

import { AccountSettingsView } from "./AccountSettingsView"
import { LeagueSettingsView } from "./LeagueSettingsView"
import { useLeagueContext } from "@/components/league/LeagueContext"
import { PageHeader } from "@/components/layout/PageHeader"
import { OrganizationDetailsView } from "@/components/organization/OrganizationDetailsView"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { pageTitle } from "@/lib/i18n"
import type { SettingsTab } from "@/lib/settings-tabs"
import {
  settings_tab_account,
  settings_tab_league,
  settings_tab_organization,
  settings_tabs_label,
} from "@/paraglide/messages.js"

interface SettingsViewProps {
  tab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
}

const TAB_ICONS = {
  account: IconUserCircle,
  organization: IconBuildingCommunity,
  league: IconTrophy,
} as const

export function SettingsView({ tab, onTabChange }: SettingsViewProps) {
  const league = useLeagueContext()
  const labels = {
    account: settings_tab_account(),
    organization: settings_tab_organization(),
    league: settings_tab_league(),
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => onTabChange(value as SettingsTab)}
      className="gap-5"
    >
      {/* Settings are not a navigation target in the header bar — from `md` up this
          would otherwise be the only page without a location label. */}
      <PageHeader title={pageTitle("settings")} />
      <TabsList
        aria-label={settings_tabs_label()}
        className="w-full max-md:h-11! md:w-fit"
      >
        {(["account", "organization", "league"] as const).map((value) => {
          const Icon = TAB_ICONS[value]
          return (
            <TabsTrigger
              key={value}
              value={value}
              className="px-3 max-md:min-h-10 sm:min-w-32"
            >
              <Icon data-icon="inline-start" />
              {labels[value]}
            </TabsTrigger>
          )
        })}
      </TabsList>

      <TabsContent value="account">
        {tab === "account" ? <AccountSettingsView /> : null}
      </TabsContent>
      <TabsContent value="organization">
        {tab === "organization" ? (
          <OrganizationDetailsView organizationId={league.organizationId} />
        ) : null}
      </TabsContent>
      <TabsContent value="league">
        {tab === "league" ? <LeagueSettingsView /> : null}
      </TabsContent>
    </Tabs>
  )
}
