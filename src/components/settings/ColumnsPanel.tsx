import { useId } from "react"

import { ResponsivePanel } from "@/components/layout/ResponsivePanel"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { ALL_TABLE_COLUMNS, columnLabel } from "@/lib/leaderboard"
import { toggleColumn } from "@/lib/settings-view"
import type { TableColumn } from "@/lib/types"
import {
  common_name,
  settings_columns_name_fixed,
  settings_table_overview_hint,
  settings_visible_columns,
} from "@/paraglide/messages.js"

interface ColumnsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: Array<TableColumn>
  onChange: (columns: Array<TableColumn>) => void
}

/**
 * Visible columns of the table.
 *
 * The name column is fixed: without it the table is a list of numbers with nothing to
 * attach them to. The same selection also drives the overview, which is stated in the
 * panel so nobody looks for a second setting.
 */
export function ColumnsPanel({
  open,
  onOpenChange,
  columns,
  onChange,
}: ColumnsPanelProps) {
  const groupId = useId()

  return (
    <ResponsivePanel
      open={open}
      onOpenChange={onOpenChange}
      title={settings_visible_columns()}
      description={settings_table_overview_hint()}
    >
      <FieldGroup>
        <FieldLabel htmlFor={`${groupId}-name`}>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>{common_name()}</FieldTitle>
              <FieldDescription>
                {settings_columns_name_fixed()}
              </FieldDescription>
            </FieldContent>
            <Checkbox id={`${groupId}-name`} checked disabled />
          </Field>
        </FieldLabel>

        {ALL_TABLE_COLUMNS.map((column) => {
          const id = `${groupId}-${column}`
          const checked = columns.includes(column)

          return (
            <FieldLabel key={column} htmlFor={id}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{columnLabel(column)}</FieldTitle>
                </FieldContent>
                <Checkbox
                  id={id}
                  checked={checked}
                  // The last column cannot be unchecked — `toggleColumn()` then
                  // returns the same selection.
                  onCheckedChange={(next) =>
                    onChange(toggleColumn(columns, column, next))
                  }
                />
              </Field>
            </FieldLabel>
          )
        })}
      </FieldGroup>
    </ResponsivePanel>
  )
}
