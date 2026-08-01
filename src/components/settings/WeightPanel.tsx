import { useState } from "react"

import { ResponsivePanel } from "@/components/layout/ResponsivePanel"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatWeight } from "@/lib/format"
import { WEIGHT_MAX, WEIGHT_MIN, WEIGHT_STEP } from "@/lib/settings-view"
import {
  common_cancel,
  settings_apply,
  settings_weight,
  settings_weight_description,
  settings_weight_value,
} from "@/paraglide/messages.js"

interface WeightPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weight: number
  onSave: (weight: number) => void
}

/**
 * Strong player weight.
 *
 * Unlike a choice, this only saves on apply: dragging would otherwise write every
 * intermediate value.
 */
export function WeightPanel({
  open,
  onOpenChange,
  weight,
  onSave,
}: WeightPanelProps) {
  return (
    <ResponsivePanel
      open={open}
      onOpenChange={onOpenChange}
      title={settings_weight()}
      description={settings_weight_description()}
    >
      {/* The slider starts at the saved value on every open. Instead of syncing that
          state in an effect, it hangs off a `key`. */}
      <WeightForm
        key={`${weight}-${open}`}
        weight={weight}
        onCancel={() => onOpenChange(false)}
        onSave={(next) => {
          onSave(next)
          onOpenChange(false)
        }}
      />
    </ResponsivePanel>
  )
}

interface WeightFormProps {
  weight: number
  onCancel: () => void
  onSave: (weight: number) => void
}

function WeightForm({ weight, onCancel, onSave }: WeightFormProps) {
  const [draft, setDraft] = useState(weight)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">
          {settings_weight_value()}
        </span>
        <span
          aria-live="polite"
          className="font-heading text-2xl leading-none font-semibold tabular-nums"
        >
          {formatWeight(draft)}
        </span>
      </div>

      <Slider
        aria-label={settings_weight()}
        min={WEIGHT_MIN}
        max={WEIGHT_MAX}
        step={WEIGHT_STEP}
        value={draft}
        onValueChange={(next) =>
          setDraft(Array.isArray(next) ? (next[0] ?? draft) : next)
        }
        className="py-2"
      />

      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{formatWeight(WEIGHT_MIN)}</span>
        <span>{formatWeight(WEIGHT_MAX)}</span>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          {common_cancel()}
        </Button>
        <Button onClick={() => onSave(draft)}>{settings_apply()}</Button>
      </div>
    </div>
  )
}
