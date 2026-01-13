"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

interface LogActivityParams {
  action: string
  entityType: string
  entityId?: string
  metadata?: Record<string, any>
}

export async function logActivity({
  action,
  entityType,
  entityId,
  metadata,
}: LogActivityParams) {
  try {
    const session = await auth()
    if (!session?.user) return

    const headersList = headers()
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    await prisma.activityLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action,
        entityType,
        entityId,
        metadata,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}

export async function getActivityLogs(params?: {
  entityType?: string
  entityId?: string
  page?: number
  limit?: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const page = params?.page || 1
  const limit = params?.limit || 50
  const skip = (page - 1) * limit

  const where: any = {
    tenantId: session.user.tenantId,
  }

  if (params?.entityType) {
    where.entityType = params.entityType
  }

  if (params?.entityId) {
    where.entityId = params.entityId
  }

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ])

  // Fetch user info for the logs
  const userIds = Array.from(new Set(items.map((i) => i.userId).filter(Boolean)))
  const users = await prisma.user.findMany({
    where: { id: { in: userIds as string[] } },
    select: { id: true, name: true, email: true },
  })

  const userMap = new Map(users.map((u) => [u.id, u]))

  const logsWithUsers = items.map((log) => ({
    ...log,
    user: log.userId ? userMap.get(log.userId) : null,
  }))

  return {
    items: logsWithUsers,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    },
  }
}
