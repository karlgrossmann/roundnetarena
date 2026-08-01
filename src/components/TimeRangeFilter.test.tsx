import { useState } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TimeRangeFilter } from "./TimeRangeFilter"
import type { TimeRange } from "@/lib/time-range"

const options = [
  { value: "all", label: "Alle" },
  { value: "four-weeks", label: "4 Wochen" },
  { value: "six-months", label: "6 Monate" },
] as const

function Harness() {
  const [range, setRange] = useState<TimeRange>("all")
  return (
    <>
      <TimeRangeFilter value={range} options={options} onChange={setRange} />
      <output>
        {typeof range === "string" ? range : `${range.from}/${range.to}`}
      </output>
    </>
  )
}

function openCustomRange() {
  fireEvent.click(screen.getByRole("button", { name: "Zeitraum" }))
}

describe("TimeRangeFilter", () => {
  it("keeps the existing quick filters working", () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole("button", { name: "4 Wochen" }))

    expect(screen.getByText("four-weeks")).toBeTruthy()
  })

  it("applies a complete custom range", async () => {
    render(<Harness />)
    openCustomRange()

    fireEvent.change(await screen.findByLabelText("Von"), {
      target: { value: "2026-06-01" },
    })
    fireEvent.change(screen.getByLabelText("Bis"), {
      target: { value: "2026-06-30" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Zeitraum anwenden" }))

    expect(screen.getByText("2026-06-01/2026-06-30")).toBeTruthy()
    expect(
      screen.getByRole("button", { name: /01\.06\.2026–30\.06\.2026/ })
    ).toBeTruthy()
  })

  it("keeps a reversed range open and explains why", async () => {
    render(<Harness />)
    openCustomRange()

    fireEvent.change(await screen.findByLabelText("Von"), {
      target: { value: "2026-06-30" },
    })
    fireEvent.change(screen.getByLabelText("Bis"), {
      target: { value: "2026-06-01" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Zeitraum anwenden" }))

    expect(
      screen.getByText("Das Von-Datum darf nicht nach dem Bis-Datum liegen.")
    ).toBeTruthy()
    expect(screen.getByText("all")).toBeTruthy()
  })
})
