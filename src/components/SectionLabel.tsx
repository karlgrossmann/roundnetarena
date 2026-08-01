import { cn } from "@/lib/utils"

interface SectionLabelProps {
  children: React.ReactNode
  className?: string
}

/** Small heading above a group of cards. Uppercase and widely tracked so it structures
 *  the page without competing with the content for attention. */
export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <span
      className={cn(
        "text-xs font-medium tracking-wider text-muted-foreground uppercase",
        className
      )}
    >
      {children}
    </span>
  )
}
