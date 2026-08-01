import { beforeEach, describe, expect, it, vi } from "vitest"

import { solveMatching } from "./solver"
import { buildWeightMatrices } from "./weights"
import type { MatchmakingPlayer } from "./cost"

const glpkMocks = vi.hoisted(() => ({
  create: vi.fn(),
  solve: vi.fn(),
}))

vi.mock("glpk.js/node", () => ({
  default: glpkMocks.create,
}))

const GLP_UNDEF = 1
const GLP_FEAS = 2
const GLP_OPT = 5

const players: Array<MatchmakingPlayer> = Array.from(
  { length: 8 },
  (_, index) => ({
    id: `p${index}`,
    rating: 1700 - index * 50,
  })
)
const input = {
  players,
  weights: buildWeightMatrices(
    players.map((player) => player.id),
    []
  ),
  higherRatingWeight: 2,
}

function result(status: number) {
  return {
    name: "roundnet_matchmaking",
    time: 0,
    result: {
      status,
      z: 0,
      vars: { x0: 1, x69: 1 },
    },
  }
}

describe("GLPK solver configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    glpkMocks.create.mockResolvedValue({
      GLP_MIN: 1,
      GLP_FX: 5,
      GLP_MSG_ERR: 1,
      GLP_UNDEF,
      GLP_FEAS,
      GLP_OPT,
      solve: glpkMocks.solve,
    })
  })

  it("asks for an exact optimum by default", async () => {
    glpkMocks.solve.mockReturnValue(result(GLP_OPT))

    await expect(solveMatching(input)).resolves.toMatchObject({
      matchups: expect.any(Array),
    })
    expect(glpkMocks.solve).toHaveBeenCalledTimes(1)
    expect(glpkMocks.solve.mock.calls[0][1]).toMatchObject({
      mipgap: 0,
      tmlim: 20,
      presol: true,
    })
  })

  it("retries once with a longer limit when only a feasible solution is found", async () => {
    glpkMocks.solve
      .mockReturnValueOnce(result(GLP_FEAS))
      .mockReturnValueOnce(result(GLP_OPT))

    await expect(solveMatching(input)).resolves.toMatchObject({
      matchups: expect.any(Array),
    })
    expect(glpkMocks.solve).toHaveBeenCalledTimes(2)
    expect(glpkMocks.solve.mock.calls[0][1]).toMatchObject({ tmlim: 20 })
    expect(glpkMocks.solve.mock.calls[1][1]).toMatchObject({
      mipgap: 0,
      tmlim: 60,
    })
  })

  it("never returns an unproven approximate solution", async () => {
    glpkMocks.solve.mockReturnValue(result(GLP_FEAS))

    await expect(solveMatching(input)).rejects.toThrow(
      "matcher.optimality_timeout"
    )
    expect(glpkMocks.solve).toHaveBeenCalledTimes(2)
  })

  it("respects an explicit time limit without a hidden retry", async () => {
    glpkMocks.solve.mockReturnValue(result(GLP_FEAS))

    await expect(
      solveMatching({ ...input, timeLimitSeconds: 5 })
    ).rejects.toThrow("matcher.optimality_timeout")
    expect(glpkMocks.solve).toHaveBeenCalledTimes(1)
    expect(glpkMocks.solve.mock.calls[0][1]).toMatchObject({
      mipgap: 0,
      tmlim: 5,
    })
  })
})
