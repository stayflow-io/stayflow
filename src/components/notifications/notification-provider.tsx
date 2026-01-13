"use client"

import { useState, useEffect } from "react"
import { getNotifications, type Notification } from "@/actions/notifications"

interface NotificationProviderProps {
  children: (notifications: Notification[]) => React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const data = await getNotifications()
        setNotifications(data)
      } catch (error) {
        console.error("Erro ao carregar notificacoes:", error)
      }
    }

    fetchNotifications()

    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return <>{children(notifications)}</>
}
