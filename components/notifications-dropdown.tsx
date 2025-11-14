"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { notificationStore } from "@/lib/notification-store"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCircle2, XCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState(notificationStore.getNotifications())
  const [unreadCount, setUnreadCount] = useState(notificationStore.getUnreadCount())
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Atualizar notificações quando houver mudanças
    const unsubscribe = notificationStore.addListener((newNotifications) => {
      setNotifications(newNotifications)
      setUnreadCount(notificationStore.getUnreadCount())
    })

    return unsubscribe
  }, [])

  const handleMarkAsRead = (id: string) => {
    notificationStore.markAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    notificationStore.markAllAsRead()
  }

  const handleClearAll = () => {
    notificationStore.clearAll()
  }

  const getIcon = (variant?: "default" | "destructive") => {
    if (variant === "destructive") {
      return <XCircle className="h-4 w-4 text-destructive" />
    }
    return <CheckCircle2 className="h-4 w-4 text-primary" />
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-accent/50"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive hover:bg-destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleMarkAllAsRead}
              >
                Marcar todas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                onClick={handleClearAll}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent/50 transition-colors cursor-pointer",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.variant)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            !notification.read && "font-semibold"
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notification.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {notification.userName && (
                          <p className="text-xs text-muted-foreground">
                            por <span className="font-medium">{notification.userName}</span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true,
                            locale: ptBR,
                          }).replace(/^(há|atrás)/, "há")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

