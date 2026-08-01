import type { ReactNode } from "react"
import { IconX } from "@/components/icons"

import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { common_close } from "@/paraglide/messages.js"

interface ResponsivePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  /** Actions along the bottom edge — stacked below `md`, right-aligned from `md` up. */
  footer?: ReactNode
}

/** Enough room at the bottom, correspondingly more on devices with a home indicator. */
const SAFE_BOTTOM = "pb-[max(1rem,env(safe-area-inset-bottom))]"

/**
 * Overlay that follows the width: a drawer from the bottom below `md`, a centered dialog
 * from `md` up.
 *
 * At the edge of the court it is operated with the thumb — there the content belongs at
 * the bottom of the screen and has to be swipeable. At a desk the same gesture would be
 * an unnecessarily wide mouse movement.
 */
export function ResponsivePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: ResponsivePanelProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : null}
          </DrawerHeader>

          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto p-4",
              footer ? undefined : SAFE_BOTTOM
            )}
          >
            {children}
          </div>

          {footer ? (
            <DrawerFooter className={SAFE_BOTTOM}>{footer}</DrawerFooter>
          ) : null}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85svh] overflow-y-auto"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
        <DialogClose
          aria-label={common_close()}
          render={
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            />
          }
        >
          <IconX />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
