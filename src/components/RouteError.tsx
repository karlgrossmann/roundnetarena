import type { ReactNode } from "react"
import { IconAlertTriangle } from "@/components/icons"
import { useRouter } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  common_retry,
  route_error_details,
  route_error_generic,
  route_error_title,
} from "@/paraglide/messages.js"

interface RouteErrorProps {
  /** What went wrong — in the language of the page, not of the stack. */
  description?: string
  /** Resets the route's error boundary; comes from `ErrorComponentProps`. */
  reset?: () => void
  /** The technical cause. Only visible in development, never to users. */
  error?: unknown
  /** An additional way out next to retry, such as a link to the start page. */
  action?: ReactNode
}

/**
 * Error state of a route.
 *
 * Retry resets the error boundary *and* invalidates the route — without the second step
 * the error would persist, because the loader would never run again.
 */
export function RouteError({
  description,
  reset,
  error,
  action,
}: RouteErrorProps) {
  const router = useRouter()
  const details = import.meta.env.DEV ? errorMessage(error) : undefined

  function retry() {
    reset?.()
    void router.invalidate()
  }

  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconAlertTriangle />
        </EmptyMedia>
        <EmptyTitle>{route_error_title()}</EmptyTitle>
        <EmptyDescription>
          {description ?? route_error_generic()}
        </EmptyDescription>
        {details ? (
          <p className="mt-1 font-mono text-xs break-words text-muted-foreground">
            {route_error_details()}: {details}
          </p>
        ) : null}
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={retry}>{common_retry()}</Button>
        {action}
      </EmptyContent>
    </Empty>
  )
}

/** Only as much text as an error boundary reliably has — `error` is deliberately `unknown`. */
function errorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return undefined
}
