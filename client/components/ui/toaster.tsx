/**
 * @fileoverview Рендер компактных toast-уведомлений приложения
 * @module components/ui/toaster
 */

import { useToast } from "@/hooks/use-toast"
import { AlertCircle, Info } from "lucide-react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === "destructive"
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex min-w-0 items-start gap-2.5">
              <div
                className={[
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                  isDestructive
                    ? "bg-red-500/12 text-red-500"
                    : "bg-blue-500/12 text-blue-500",
                ].join(" ")}
              >
                {isDestructive
                  ? <AlertCircle className="h-3.5 w-3.5" />
                  : <Info className="h-3.5 w-3.5" />}
              </div>
              <div className="grid min-w-0 gap-0.5">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
