"use client"

import * as React from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle } from "lucide-react"
import { notificationStore } from "@/lib/notification-store"
import { useAuth } from "@/lib/auth-context"

// Componente para um toast individual
const processedToasts = new Set<string>()

function ToastItem({ id, title, description, action, variant, userName, ...props }: any) {
  const { user } = useAuth()
  
  // Adicionar ao histórico de notificações quando o toast aparecer (apenas uma vez)
  React.useEffect(() => {
    if (title && !processedToasts.has(id)) {
      processedToasts.add(id)
      // Usar o userName passado diretamente, ou o usuário atual como fallback
      const nomeUsuario = userName || user?.nome || user?.login || "Sistema"
      notificationStore.addNotification({
        title: typeof title === "string" ? title : "",
        description: typeof description === "string" ? description : undefined,
        variant: variant || "default",
        userName: nomeUsuario,
      })
    }
  }, [id, title, description, variant, user, userName])

  // Ícone baseado no variant
  const getIcon = () => {
    if (variant === "destructive") {
      return <XCircle className="h-4 w-4 text-red-300" />
    }
    return <CheckCircle2 className="h-4 w-4 text-blue-400" />
  }

  return (
    <Toast {...props} variant={variant}>
      <div className="flex items-start gap-2.5 w-full">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="grid gap-0.5 flex-1">
          {title && <ToastTitle className="font-semibold">{title}</ToastTitle>}
          {description && (
            <ToastDescription className="text-xs opacity-90">
              {description}
            </ToastDescription>
          )}
        </div>
      </div>
      {action}
      <ToastClose />
    </Toast>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
