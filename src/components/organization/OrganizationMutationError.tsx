import { domainIssueFromError } from "@/lib/domain-errors"
import { translateDomainIssue } from "@/lib/i18n"

interface OrganizationMutationErrorProps {
  error: unknown
  fallback: string
}

export function OrganizationMutationError({
  error,
  fallback,
}: OrganizationMutationErrorProps) {
  const issue = domainIssueFromError(error)

  return (
    <p role="alert" className="text-sm text-destructive">
      {issue ? translateDomainIssue(issue) : fallback}
    </p>
  )
}
