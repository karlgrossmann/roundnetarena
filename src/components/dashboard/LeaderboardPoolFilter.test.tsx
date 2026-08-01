import { useState } from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LeaderboardPoolFilter } from "./LeaderboardPoolFilter"

function Harness() {
  const [checked, setChecked] = useState(false)
  return (
    <>
      <LeaderboardPoolFilter checked={checked} onCheckedChange={setChecked} />
      <output>{checked ? "Pool" : "All"}</output>
    </>
  )
}

describe("LeaderboardPoolFilter", () => {
  it("is understandably labelled and switches the view", () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole("switch", { name: "Nur aktueller Pool" }))

    expect(screen.getByText("Pool")).toBeTruthy()
  })
})
