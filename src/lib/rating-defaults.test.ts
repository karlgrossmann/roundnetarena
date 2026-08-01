import { describe, expect, it } from "vitest"

import {
  hasInitialValueErrors,
  parseLocalizedNumber,
  validateInitialValues,
} from "./rating-defaults"

describe("parseLocalizedNumber", () => {
  it("accepts a German decimal comma and surrounding whitespace", () => {
    expect(parseLocalizedNumber(" 125,5 ")).toBe(125.5)
  })

  it("rejects empty and invalid input", () => {
    expect(parseLocalizedNumber("")).toBeNull()
    expect(parseLocalizedNumber("abc")).toBeNull()
  })
})

describe("validateInitialValues", () => {
  it("accepts the boundaries and common defaults", () => {
    expect(
      validateInitialValues({ initialRating: "100", initialRd: "350" })
    ).toEqual({})
    expect(
      validateInitialValues({ initialRating: "1725", initialRd: "100" })
    ).toEqual({})
  })

  it("reports values outside the rating boundaries", () => {
    expect(
      validateInitialValues({ initialRating: "99", initialRd: "125" })
        .initialRating
    ).toEqual({ code: "settings.initial_rating_out_of_range" })
    expect(
      validateInitialValues({ initialRating: "3001", initialRd: "125" })
        .initialRating
    ).toBeDefined()
  })

  it("reports values outside the RD boundaries", () => {
    expect(
      validateInitialValues({ initialRating: "1500", initialRd: "29" })
        .initialRd
    ).toEqual({ code: "settings.initial_rd_out_of_range" })
    expect(
      validateInitialValues({ initialRating: "1500", initialRd: "351" })
        .initialRd
    ).toBeDefined()
  })

  it("requires whole numbers for persisted defaults", () => {
    const errors = validateInitialValues({
      initialRating: "1500,5",
      initialRd: "125.5",
    })

    expect(errors.initialRating).toBeDefined()
    expect(errors.initialRd).toBeDefined()
    expect(hasInitialValueErrors(errors)).toBe(true)
  })
})
