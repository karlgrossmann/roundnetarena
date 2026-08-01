import type { ReactNode } from "react"

import { SettingsSection } from "./SettingsSection"
import { Card } from "@/components/ui/card"

interface SettingsGroupProps {
  label: string
  children: ReactNode
}

export function SettingsGroup({ label, children }: SettingsGroupProps) {
  return (
    <SettingsSection label={label}>
      <Card className="py-0">
        <div className="divide-y">{children}</div>
      </Card>
    </SettingsSection>
  )
}
