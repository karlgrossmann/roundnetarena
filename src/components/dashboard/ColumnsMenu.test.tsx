import { useState } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ColumnsMenu } from "./ColumnsMenu"
import { ALL_TABLE_COLUMNS } from "@/lib/leaderboard"
import type { TableColumn } from "@/lib/types"

/** Mirrors the selection as text so the test can check it without a table. */
function Harness({ initial }: { initial: Array<TableColumn> }) {
  const [columns, setColumns] = useState(initial)

  return (
    <>
      <ColumnsMenu visibleColumns={columns} onChange={setColumns} />
      <p data-testid="selection">{columns.join(",")}</p>
    </>
  )
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: /Spalten/ }))
}

function selection() {
  return screen.getByTestId("selection").textContent
}

describe("ColumnsMenu", () => {
  it("shows all columns when opened", async () => {
    render(<Harness initial={ALL_TABLE_COLUMNS} />)
    openMenu()

    const items = await screen.findAllByRole("menuitemcheckbox")
    expect(items).toHaveLength(ALL_TABLE_COLUMNS.length)
  })

  it("hides a column", async () => {
    render(<Harness initial={ALL_TABLE_COLUMNS} />)
    openMenu()

    fireEvent.click(await screen.findByRole("menuitemcheckbox", { name: "RD" }))

    expect(selection()).not.toContain("rd")
    expect(selection()).toContain("rating")
  })

  it("puts a re-enabled column back in its original place", async () => {
    render(<Harness initial={["rating", "gamesPlayed"]} />)
    openMenu()

    fireEvent.click(await screen.findByRole("menuitemcheckbox", { name: "RD" }))

    // Not at the end — the order stays the canonical one from ALL_TABLE_COLUMNS.
    expect(selection()).toBe("rating,rd,gamesPlayed")
  })
})
