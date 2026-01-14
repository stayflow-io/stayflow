"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        tenantName={session?.user?.tenantName}
        userName={session?.user?.name}
      />
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        tenantName={session?.user?.tenantName}
        userName={session?.user?.name}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <NotificationProvider>
          {(notifications) => (
            <Header
              onMenuClick={() => setMobileNavOpen(true)}
              notifications={notifications}
            />
          )}
        </NotificationProvider>
        <main className="flex-1 p-6 bg-muted/30 overflow-y-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
