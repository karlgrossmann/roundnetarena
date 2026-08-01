import { createContext, useContext } from "react"
import type { ReactNode } from "react"

import type { LeagueContext as LeagueContextValue } from "@/lib/types"

const LeagueContext = createContext<LeagueContextValue | null>(null)

export function LeagueContextProvider({
  children,
  value,
}: {
  children: ReactNode
  value: LeagueContextValue
}) {
  return (
    <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>
  )
}

export function useLeagueContext(): LeagueContextValue {
  const context = useContext(LeagueContext)
  if (!context) {
    throw new Error("LeagueContextProvider is missing.")
  }
  return context
}
