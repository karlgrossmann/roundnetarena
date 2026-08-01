import type { ReactNode } from "react"

interface StickyActionBarProps {
  children: ReactNode
  /** Explanation below the button — names the reason when the action is blocked. */
  hint?: string
}

/**
 * Fixed area for a page's primary action.
 *
 * Below `md` pinned above the tab bar — its height lives as `--tab-bar-height` in
 * `styles.css` so the two bars never overlap. The upward gradient fades out content
 * running underneath instead of cutting it off hard. From `md` up the bar simply flows
 * along.
 */
export function StickyActionBar({ children, hint }: StickyActionBarProps) {
  return (
    <>
      {/* Reserves the space the fixed bar covers, below `md`. */}
      <div aria-hidden className="h-20 md:hidden" />

      <div className="fixed inset-x-0 bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))] z-30 bg-linear-to-t from-background from-60% to-transparent px-4 pt-8 pb-3 md:static md:mt-2 md:bg-none md:p-0">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1.5">
          {children}
          {hint && (
            <p className="text-center text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </div>
    </>
  )
}
