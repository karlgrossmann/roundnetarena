import { createServerFn } from "@tanstack/react-start"

import type { AccountDetails } from "@/lib/types"

import { authed } from "../middleware/auth"

export const fetchAccount = createServerFn({ method: "GET" })
  .middleware([authed])
  .handler(async ({ context }): Promise<AccountDetails> => ({
    name: context.auth.user.name,
    email: context.auth.user.email,
  }))
