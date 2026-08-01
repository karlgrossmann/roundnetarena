import type { ReactNode } from "react"
import { IconChevronRight } from "@/components/icons"

interface SettingsRowProps {
  label: string
  /** What the setting does — in match-day language, not backend language. */
  description?: string
  value?: ReactNode
  /** Opens the panel that changes the value. Without it the row is display-only. */
  onOpen?: () => void
  /** Control instead of a value — a switch that sits in the row itself, for example. */
  control?: ReactNode
}

const ROW_CLASS =
  "flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left"

/**
 * One settings row, patterned after phone system settings: label left, value right.
 *
 * The value is changed in a panel rather than in the row — that keeps the list calm and
 * thumb-operable. The switch is the exception: it *is* already the shortest edit.
 */
export function SettingsRow({
  label,
  description,
  value,
  onOpen,
  control,
}: SettingsRowProps) {
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {description ? (
          <span className="block text-sm text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>

      {value ? (
        <span className="shrink-0 text-sm text-muted-foreground">{value}</span>
      ) : null}
    </>
  )

  if (control) {
    return (
      <div className={ROW_CLASS}>
        {content}
        <span className="shrink-0">{control}</span>
      </div>
    )
  }

  if (!onOpen) {
    return <div className={ROW_CLASS}>{content}</div>
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${ROW_CLASS} transition-colors hover:bg-muted/50`}
    >
      {content}
      <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}
