import { useState } from "react"
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"

import { SettingsGroup } from "./SettingsGroup"
import { SettingsRow } from "./SettingsRow"
import { AuthStatus } from "@/components/auth/AuthStatus"
import { LanguageSelect } from "@/components/language/LanguageSelect"
import { ResponsivePanel } from "@/components/layout/ResponsivePanel"
import { ThemeSettings } from "@/components/theme/ThemeSettings"
import { Button } from "@/components/ui/button"
import { accountQueryOptions } from "@/lib/api/queries"
import { requestPasswordResetEmail } from "@/lib/auth-client"
import {
  account_email,
  account_name,
  account_password,
  account_password_description,
  account_password_panel_description,
  account_password_panel_title,
  account_password_reset_error_description,
  account_password_reset_error_title,
  account_password_reset_notice,
  account_password_reset_send,
  account_password_reset_sending,
  account_password_reset_success_description,
  account_password_reset_success_title,
  account_profile,
  account_security,
  common_cancel,
  common_close,
  language_settings_description,
  language_settings_group,
  language_settings_label,
} from "@/paraglide/messages.js"

export function AccountSettingsView() {
  const { data: account } = useSuspenseQuery(accountQueryOptions())
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false)
  const passwordReset = useMutation({
    mutationFn: () => requestPasswordResetEmail(account.email),
  })

  function handlePasswordPanelOpenChange(open: boolean) {
    setPasswordPanelOpen(open)
    if (open) passwordReset.reset()
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsGroup label={account_profile()}>
        <SettingsRow label={account_name()} value={account.name} />
        <SettingsRow
          label={account_email()}
          value={
            <span
              className="block max-w-44 truncate sm:max-w-80"
              title={account.email}
            >
              {account.email}
            </span>
          }
        />
      </SettingsGroup>

      <SettingsGroup label={account_security()}>
        <SettingsRow
          label={account_password()}
          description={account_password_description()}
          onOpen={() => handlePasswordPanelOpenChange(true)}
        />
      </SettingsGroup>

      <SettingsGroup label={language_settings_group()}>
        <SettingsRow
          label={language_settings_label()}
          description={language_settings_description()}
          control={<LanguageSelect />}
        />
      </SettingsGroup>

      <ThemeSettings />

      <ResponsivePanel
        open={passwordPanelOpen}
        onOpenChange={handlePasswordPanelOpenChange}
        title={account_password_panel_title()}
        description={account_password_panel_description()}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={passwordReset.isPending}
              onClick={() => setPasswordPanelOpen(false)}
            >
              {passwordReset.isSuccess ? common_close() : common_cancel()}
            </Button>
            {passwordReset.isSuccess ? null : (
              <Button
                type="button"
                disabled={passwordReset.isPending}
                onClick={() => passwordReset.mutate()}
              >
                {passwordReset.isPending
                  ? account_password_reset_sending()
                  : account_password_reset_send()}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          {passwordReset.isSuccess ? (
            <AuthStatus
              kind="success"
              title={account_password_reset_success_title()}
              description={account_password_reset_success_description({
                email: account.email,
              })}
            />
          ) : (
            <>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="truncate font-medium" title={account.email}>
                  {account.email}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {account_password_reset_notice()}
                </p>
              </div>
              {passwordReset.isError ? (
                <AuthStatus
                  kind="error"
                  title={account_password_reset_error_title()}
                  description={account_password_reset_error_description()}
                />
              ) : null}
            </>
          )}
        </div>
      </ResponsivePanel>
    </div>
  )
}
