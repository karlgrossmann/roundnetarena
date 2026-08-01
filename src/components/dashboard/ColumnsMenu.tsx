import { IconColumns } from "@/components/icons"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ALL_TABLE_COLUMNS, columnLabel } from "@/lib/leaderboard"
import type { TableColumn } from "@/lib/types"
import { leaderboard_columns } from "@/paraglide/messages.js"

interface ColumnsMenuProps {
  visibleColumns: Array<TableColumn>
  onChange: (columns: Array<TableColumn>) => void
}

/** Picks the visible columns. The order stays the canonical one from
 *  `ALL_TABLE_COLUMNS`, so a column re-enabled doesn't jump to the end. */
export function ColumnsMenu({ visibleColumns, onChange }: ColumnsMenuProps) {
  function toggle(column: TableColumn, checked: boolean) {
    const next = checked
      ? [...visibleColumns, column]
      : visibleColumns.filter((candidate) => candidate !== column)

    onChange(ALL_TABLE_COLUMNS.filter((candidate) => next.includes(candidate)))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
        <IconColumns />
        {leaderboard_columns()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* `DropdownMenuLabel` is a group label and throws without an enclosing group —
            the menu would then stay empty on open. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>{leaderboard_columns()}</DropdownMenuLabel>
          {ALL_TABLE_COLUMNS.map((column) => (
            <DropdownMenuCheckboxItem
              key={column}
              checked={visibleColumns.includes(column)}
              onCheckedChange={(checked) => toggle(column, checked)}
            >
              {columnLabel(column)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
