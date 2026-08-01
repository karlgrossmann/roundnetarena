import type { ReactNode } from "react"

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toast,
  useToastManager,
} from "@/components/ui/toast"
import { common_close } from "@/paraglide/messages.js"

/** Project wrapper that also localizes the toast close action for screen readers. */
export function LocalizedToaster({ children }: { children: ReactNode }) {
  return (
    <ToastProvider toastManager={toast}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <LocalizedToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}

function LocalizedToastList() {
  const { toasts } = useToastManager()

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose aria-label={common_close()} />
      </ToastContent>
    </Toast>
  ))
}
