import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { IconCheck } from "@/components/icons"

import { RadioGroup } from "@/components/ui/radio-group"
import { ORGANIZATION_BRAND_COLORS } from "@/lib/organization-brand"
import type { OrganizationBrandColor } from "@/lib/organization-brand"
import {
  organization_brand_blue,
  organization_brand_color_label,
  organization_brand_green,
  organization_brand_indigo,
  organization_brand_lime,
  organization_brand_orange,
  organization_brand_purple,
  organization_brand_red,
  organization_brand_yellow,
} from "@/paraglide/messages.js"

interface OrganizationBrandColorPickerProps {
  value: OrganizationBrandColor
  disabled?: boolean
  onValueChange: (value: OrganizationBrandColor) => void
}

export function OrganizationBrandColorPicker({
  value,
  disabled,
  onValueChange,
}: OrganizationBrandColorPickerProps) {
  return (
    <RadioGroup
      aria-label={organization_brand_color_label()}
      value={value}
      disabled={disabled}
      onValueChange={(nextValue) => {
        if (isBrandColor(nextValue)) onValueChange(nextValue)
      }}
      className="flex w-full flex-wrap gap-1"
    >
      {ORGANIZATION_BRAND_COLORS.map((brandColor) => {
        const label = brandColorLabel(brandColor)
        return (
          <RadioPrimitive.Root
            key={brandColor}
            value={brandColor}
            aria-label={label}
            title={label}
            className="group relative grid size-9 shrink-0 place-items-center rounded-lg border border-transparent transition-[background-color,border-color,box-shadow,transform] outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-border data-checked:bg-card data-checked:shadow-sm"
          >
            <span
              data-brand-color={brandColor}
              className="relative grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs ring-1 ring-black/5 transition-transform group-hover:scale-103"
            >
              <RadioPrimitive.Indicator className="absolute inset-0 flex items-center justify-center">
                <IconCheck className="size-4" strokeWidth={3} />
              </RadioPrimitive.Indicator>
            </span>
          </RadioPrimitive.Root>
        )
      })}
    </RadioGroup>
  )
}

function isBrandColor(value: string): value is OrganizationBrandColor {
  return ORGANIZATION_BRAND_COLORS.some((brandColor) => brandColor === value)
}

function brandColorLabel(brandColor: OrganizationBrandColor): string {
  if (brandColor === "purple") return organization_brand_purple()
  if (brandColor === "blue") return organization_brand_blue()
  if (brandColor === "indigo") return organization_brand_indigo()
  if (brandColor === "green") return organization_brand_green()
  if (brandColor === "lime") return organization_brand_lime()
  if (brandColor === "yellow") return organization_brand_yellow()
  if (brandColor === "orange") return organization_brand_orange()
  return organization_brand_red()
}
