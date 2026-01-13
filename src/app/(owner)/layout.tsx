"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, DollarSign, FileText, Home, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { ThemeToggle } from "@/components/theme/theme-toggle"

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated" && session?.user?.role !== "OWNER") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (session?.user?.role !== "OWNER") {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="h-16 border-b bg-card flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/portal" className="font-bold text-xl">
            StayFlow
          </Link>
          <span className="text-sm text-muted-foreground">Portal do Proprietario</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>
      <div className="flex">
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)] p-4 hidden md:block">
          <nav className="space-y-2">
            <Link
              href="/portal"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              <Home className="h-4 w-4" />
              Inicio
            </Link>
            <Link
              href="/portal/properties"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Meus Imoveis
            </Link>
            <Link
              href="/portal/payouts"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              Repasses
            </Link>
            <Link
              href="/portal/reports"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              <FileText className="h-4 w-4" />
              Relatorios
            </Link>
          </nav>
        </aside>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
