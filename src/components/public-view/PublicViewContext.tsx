import { createContext, useContext } from "react"
import type { ReactNode } from "react"

import type { PublicViewContext as PublicViewContextValue } from "@/lib/types"

const PublicViewContext = createContext<PublicViewContextValue | null>(null)

export function PublicViewContextProvider({
  children,
  value,
}: {
  children: ReactNode
  value: PublicViewContextValue
}) {
  return (
    <PublicViewContext.Provider value={value}>
      {children}
    </PublicViewContext.Provider>
  )
}

export function usePublicViewContext(): PublicViewContextValue {
  const context = useContext(PublicViewContext)
  if (!context) throw new Error("PublicViewContextProvider is missing.")
  return context
}
