"use client"

import { useSession } from "next-auth/react"
import { hasPermission, Permission } from "@/lib/permissions"

interface Props {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ permission, children, fallback = null }: Props) {
  const { data: session } = useSession()

  if (!session?.user?.role) {
    return fallback
  }

  if (!hasPermission(session.user.role, permission)) {
    return fallback
  }

  return <>{children}</>
}
