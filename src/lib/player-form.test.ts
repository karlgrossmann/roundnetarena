import { describe, expect, it } from "vitest"

import { makePlayer } from "./fixtures"
import {
  draftFromPlayer,
  hasErrors,
  toCreatePlayerInput,
  toUpdatePlayerInput,
  validateNewPlayer,
  validatePlayerEdit,
} from "./player-form"
import type { NewPlayerDraft } from "./player-form"

function draft(overrides: Partial<NewPlayerDraft> = {}): NewPlayerDraft {
  return {
    firstName: "Klara",
    lastName: "Nowak",
    rating: "1500",
    rd: "125",
    ...overrides,
  }
}

describe("validateNewPlayer", () => {
  it("lets a complete draft through", () => {
    expect(validateNewPlayer(draft())).toEqual({})
    expect(hasErrors(validateNewPlayer(draft()))).toBe(false)
  })

  it("requires a first and a last name", () => {
    const errors = validateNewPlayer(draft({ firstName: "", lastName: "" }))
    expect(errors.firstName).toBeDefined()
    expect(errors.lastName).toBeDefined()
  })

  it("does not count whitespace alone as a name", () => {
    expect(
      validateNewPlayer(draft({ firstName: "   " })).firstName
    ).toBeDefined()
  })

  it("rejects a rating and RD that are not numbers", () => {
    const errors = validateNewPlayer(draft({ rating: "abc", rd: "" }))
    expect(errors.rating).toBeDefined()
    expect(errors.rd).toBeDefined()
  })

  it("rejects a rating and RD outside the domain boundaries", () => {
    const errors = validateNewPlayer(draft({ rating: "0", rd: "-5" }))
    expect(errors.rating).toBeDefined()
    expect(errors.rd).toBeDefined()

    const high = validateNewPlayer(draft({ rating: "3001", rd: "351" }))
    expect(high.rating).toBeDefined()
    expect(high.rd).toBeDefined()
  })

  it("requires a whole-number rating", () => {
    expect(validateNewPlayer(draft({ rating: "1500,5" })).rating).toBeDefined()
  })

  it("accepts a comma as the decimal separator for the RD", () => {
    expect(validateNewPlayer(draft({ rd: "125,5" }))).toEqual({})
  })
})

describe("toCreatePlayerInput", () => {
  it("trims whitespace and converts numbers", () => {
    expect(
      toCreatePlayerInput(
        draft({ firstName: "  Klara ", lastName: " Nowak ", rating: " 1500 " })
      )
    ).toEqual({
      firstName: "Klara",
      lastName: "Nowak",
      rating: 1500,
      rd: 125,
    })
  })

  it("understands the comma the same way the validation does", () => {
    expect(toCreatePlayerInput(draft({ rd: "125,5" })).rd).toBe(125.5)
  })
})

describe("player edit", () => {
  const veteran = draftFromPlayer(makePlayer({ rating: 1631, rd: 24.6 }))

  it("starts from the player as they are now", () => {
    expect(veteran).toEqual({
      firstName: "Klara",
      lastName: "Nowak",
      rating: "1631",
      rd: "25",
    })
  })

  it("does not reject an untouched RD below the enterable range", () => {
    expect(
      validatePlayerEdit({ ...veteran, firstName: "Clara" }, veteran)
    ).toEqual({})
  })

  it("still checks numbers that were changed", () => {
    const errors = validatePlayerEdit(
      { ...veteran, rating: "50", rd: "20", lastName: " " },
      veteran
    )
    expect(Object.keys(errors).sort()).toEqual(["lastName", "rating", "rd"])
  })

  it("sends only the numbers that were changed", () => {
    expect(
      toUpdatePlayerInput({ ...veteran, firstName: "Clara" }, veteran)
    ).toEqual({ firstName: "Clara", lastName: "Nowak" })
    expect(
      toUpdatePlayerInput({ ...veteran, rating: "1700" }, veteran)
    ).toEqual({ firstName: "Klara", lastName: "Nowak", rating: 1700 })
    expect(toUpdatePlayerInput({ ...veteran, rd: "80,5" }, veteran)).toEqual({
      firstName: "Klara",
      lastName: "Nowak",
      rd: 80.5,
    })
  })
})
