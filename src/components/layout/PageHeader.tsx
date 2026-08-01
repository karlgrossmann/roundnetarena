import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  /** Actions belonging to the whole page — to the right of the title. */
  actions?: ReactNode
}

/**
 * Heading of a page inside the content area.
 *
 * Visible only from `md` up, on purpose: below that the title sits in the header bar.
 * From `md` up the bar carries the navigation instead, and pages that are not a
 * navigation target themselves would otherwise lose their location marker.
 *
 * Pages with their own card or section heading don't need it — two stacked titles say
 * nothing twice as usefully.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="hidden items-start justify-between gap-4 md:flex">
      <div className="min-w-0">
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
