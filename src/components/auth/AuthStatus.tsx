import { IconAlertTriangle, IconCircleCheck } from "@/components/icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface AuthStatusProps {
  kind: "error" | "success"
  title: string
  description: string
}

export function AuthStatus({ kind, title, description }: AuthStatusProps) {
  const Icon = kind === "success" ? IconCircleCheck : IconAlertTriangle

  return (
    <Alert variant={kind === "error" ? "destructive" : "default"}>
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}
