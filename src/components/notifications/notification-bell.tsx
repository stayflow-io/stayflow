"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, Calendar, ClipboardList, DollarSign, LogIn, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Notification } from "@/actions/notifications"

interface NotificationBellProps {
  notifications: Notification[]
}

const iconMap = {
  checkin: LogIn,
  checkout: LogOut,
  task: ClipboardList,
  payout: DollarSign,
}

const colorMap = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-muted-foreground",
}

export function NotificationBell({ notifications }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const highPriorityCount = notifications.filter(n => n.priority === "high").length

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {highPriorityCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {highPriorityCount > 9 ? "9+" : highPriorityCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notificacoes
          {notifications.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              {notifications.length} {notifications.length === 1 ? "item" : "itens"}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhuma notificacao
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => {
              const Icon = iconMap[notification.type]
              return (
                <DropdownMenuItem key={notification.id} asChild>
                  <Link
                    href={notification.href}
                    className="flex items-start gap-3 p-3 cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className={cn("mt-0.5", colorMap[notification.priority])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notification.description}
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </div>
        )}
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard"
                className="justify-center text-sm text-muted-foreground"
                onClick={() => setIsOpen(false)}
              >
                Ver todas
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
