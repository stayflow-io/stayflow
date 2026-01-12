"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Building2,
  Calendar,
  ClipboardList,
  DollarSign,
  Users,
  Settings,
  LogOut,
  FileBarChart,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/properties", label: "Imoveis", icon: Building2 },
  { href: "/reservations", label: "Reservas", icon: ClipboardList },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/tasks", label: "Tarefas", icon: ClipboardList },
  { href: "/financial", label: "Financeiro", icon: DollarSign },
  { href: "/owners", label: "Proprietarios", icon: Users },
  { href: "/reports", label: "Relatorios", icon: FileBarChart },
]

interface SidebarProps {
  tenantName?: string
  userName?: string
}

export function Sidebar({ tenantName, userName }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card flex-shrink-0">
      <div className="p-6 flex-shrink-0">
        <h1 className="text-xl font-bold">StayFlow</h1>
        {tenantName && (
          <p className="text-sm text-muted-foreground mt-1">{tenantName}</p>
        )}
      </div>
      <Separator />
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <Separator className="flex-shrink-0" />
      <div className="p-4 space-y-2 flex-shrink-0">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Configuracoes
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
        {userName && (
          <p className="px-3 text-xs text-muted-foreground truncate">
            {userName}
          </p>
        )}
      </div>
    </aside>
  )
}
