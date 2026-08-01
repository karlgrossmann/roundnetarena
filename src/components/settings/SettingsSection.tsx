import type { ReactNode } from "react"

import { SectionLabel } from "@/components/SectionLabel"
import { cn } from "@/lib/utils"

interface SettingsSectionProps {
  label: string
  children: ReactNode
  className?: string
}

export function SettingsSection({
  label,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </section>
  )
}
