// Store para gerenciar histórico de notificações
export interface Notification {
  id: string
  title: string
  description?: string
  variant?: "default" | "destructive"
  timestamp: number
  read: boolean
  userName?: string // Nome do usuário que registrou a ação
}

class NotificationStore {
  private notifications: Notification[] = []
  private maxNotifications = 10
  private listeners: Array<(notifications: Notification[]) => void> = []

  // Adicionar uma nova notificação
  addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">) {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      read: false,
    }

    // Adicionar no início do array
    this.notifications.unshift(newNotification)

    // Manter apenas as últimas 10
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications)
    }

    this.notifyListeners()
  }

  // Obter todas as notificações
  getNotifications(): Notification[] {
    return this.notifications
  }

  // Obter notificações não lidas
  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  // Marcar notificação como lida
  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
      this.notifyListeners()
    }
  }

  // Marcar todas como lidas
  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true))
    this.notifyListeners()
  }

  // Limpar todas as notificações
  clearAll() {
    this.notifications = []
    this.notifyListeners()
  }

  // Adicionar listener
  addListener(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  // Notificar listeners
  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.notifications]))
  }
}

export const notificationStore = new NotificationStore()

