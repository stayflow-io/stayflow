"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlobalSearch } from "./global-search"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import type { Notification } from "@/actions/notifications"

interface HeaderProps {
  onMenuClick?: () => void
  notifications?: Notification[]
}

export function Header({ onMenuClick, notifications = [] }: HeaderProps) {
  return (
    <header className="h-16 border-b bg-card flex items-center px-4 gap-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex-1 flex justify-center">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell notifications={notifications} />
      </div>
    </header>
  )
}
