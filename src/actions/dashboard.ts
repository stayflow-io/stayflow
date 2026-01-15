"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cache, cacheKeys, TTL } from "@/lib/redis"

type ReservationWithUnit = {
  id: string
  guestName: string
  checkinDate: string
  checkoutDate: string
  numGuests: number
  status: string
  unit: {
    id: string
    name: string
    property: { id: string; name: string }
  }
}

type TaskWithUnit = {
  id: string
  title: string
  type: string
  scheduledDate: string
  status: string
  unit: {
    id: string
    name: string
    property: { id: string; name: string }
  } | null
}

type DashboardStats = {
  unitsCount: number
  reservationsThisMonth: number
  pendingTasksCount: number
  revenueThisMonth: number
  upcomingCheckins: ReservationWithUnit[]
  todayTasks: TaskWithUnit[]
  todayCheckins: ReservationWithUnit[]
  todayCheckouts: ReservationWithUnit[]
  overdueTasks: number
  pendingPayouts: number
}

export type DashboardFilters = {
  ownerId?: string
  propertyId?: string
}

// Helper para criar condicao de filtro por owner/property
function buildUnitFilter(filters?: DashboardFilters) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unitWhere: any = { deletedAt: null }

  if (filters?.propertyId) {
    unitWhere.propertyId = filters.propertyId
  }

  if (filters?.ownerId) {
    unitWhere.OR = [
      { ownerId: filters.ownerId },
      { ownerId: null, property: { ownerId: filters.ownerId } },
    ]
  }

  return unitWhere
}

export async function getDashboardStats(filters?: DashboardFilters): Promise<DashboardStats> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  const cacheKey = `${cacheKeys.dashboardStats(tenantId)}:${filters?.ownerId || 'all'}:${filters?.propertyId || 'all'}`

  return cache.getOrSet<DashboardStats>(
    cacheKey,
    async () => {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      const unitFilter = buildUnitFilter(filters)

      const [
        unitsCount,
        reservationsThisMonth,
        pendingTasksCount,
        revenueThisMonth,
        upcomingCheckins,
        todayTasks,
        todayCheckins,
        todayCheckouts,
        overdueTasks,
        pendingPayouts,
      ] = await Promise.all([
        prisma.unit.count({
          where: {
            property: { tenantId },
            status: "ACTIVE",
            ...unitFilter,
          },
        }),
        prisma.reservation.count({
          where: {
            tenantId,
            checkinDate: { gte: startOfMonth, lte: endOfMonth },
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
            unit: unitFilter,
          },
        }),
        prisma.task.count({
          where: {
            tenantId,
            status: { in: ["PENDING", "IN_PROGRESS"] },
            scheduledDate: { gte: today, lt: tomorrow },
            unit: unitFilter,
          },
        }),
        prisma.reservation.aggregate({
          where: {
            tenantId,
            checkinDate: { gte: startOfMonth, lte: endOfMonth },
            status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
            unit: unitFilter,
          },
          _sum: { totalAmount: true },
        }),
        prisma.reservation.findMany({
          where: {
            tenantId,
            checkinDate: { gte: tomorrow, lte: in7Days },
            status: "CONFIRMED",
            unit: unitFilter,
          },
          include: {
            unit: {
              include: {
                property: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { checkinDate: "asc" },
          take: 5,
        }),
        prisma.task.findMany({
          where: {
            tenantId,
            scheduledDate: { gte: today, lt: tomorrow },
            status: { in: ["PENDING", "IN_PROGRESS"] },
            unit: unitFilter,
          },
          include: {
            unit: {
              include: {
                property: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { scheduledDate: "asc" },
          take: 5,
        }),
        prisma.reservation.findMany({
          where: {
            tenantId,
            checkinDate: { gte: today, lt: tomorrow },
            status: "CONFIRMED",
            unit: unitFilter,
          },
          include: {
            unit: {
              include: {
                property: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { checkinDate: "asc" },
        }),
        prisma.reservation.findMany({
          where: {
            tenantId,
            checkoutDate: { gte: today, lt: tomorrow },
            status: "CHECKED_IN",
            unit: unitFilter,
          },
          include: {
            unit: {
              include: {
                property: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { checkoutDate: "asc" },
        }),
        prisma.task.count({
          where: {
            tenantId,
            scheduledDate: { lt: today },
            status: { in: ["PENDING", "IN_PROGRESS"] },
            unit: unitFilter,
          },
        }),
        // Payouts - filtrar por owner se especificado
        filters?.ownerId
          ? prisma.ownerPayout.count({
              where: {
                owner: { tenantId, id: filters.ownerId },
                status: "PENDING",
              },
            })
          : prisma.ownerPayout.count({
              where: {
                owner: { tenantId },
                status: "PENDING",
              },
            }),
      ])

      return JSON.parse(JSON.stringify({
        unitsCount,
        reservationsThisMonth,
        pendingTasksCount,
        revenueThisMonth: revenueThisMonth._sum.totalAmount?.toNumber() || 0,
        upcomingCheckins,
        todayTasks,
        todayCheckins,
        todayCheckouts,
        overdueTasks,
        pendingPayouts,
      }))
    },
    TTL.SHORT // 1 minuto - dados do dashboard mudam frequentemente
  )
}

export async function getRevenueByMonth(filters?: DashboardFilters) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  const cacheKey = `${cacheKeys.revenueByMonth(tenantId)}:${filters?.ownerId || 'all'}:${filters?.propertyId || 'all'}`

  return cache.getOrSet(
    cacheKey,
    async () => {
      const now = new Date()

      // Buscar período de 6 meses em uma única query
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const unitFilter = buildUnitFilter(filters)

      const reservations = await prisma.reservation.findMany({
        where: {
          tenantId,
          checkinDate: { gte: sixMonthsAgo, lte: endOfCurrentMonth },
          status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
          unit: unitFilter,
        },
        select: {
          checkinDate: true,
          totalAmount: true,
        },
      })

      // Agrupar por mês no JavaScript
      const revenueByMonth = new Map<string, number>()

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${date.getFullYear()}-${date.getMonth()}`
        revenueByMonth.set(key, 0)
      }

      for (const reservation of reservations) {
        const date = new Date(reservation.checkinDate)
        const key = `${date.getFullYear()}-${date.getMonth()}`
        const current = revenueByMonth.get(key) || 0
        revenueByMonth.set(key, current + Number(reservation.totalAmount))
      }

      const months: { month: string; revenue: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${date.getFullYear()}-${date.getMonth()}`
        const monthName = date.toLocaleDateString("pt-BR", { month: "short" })
        months.push({
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          revenue: revenueByMonth.get(key) || 0,
        })
      }

      return months
    },
    TTL.MEDIUM
  )
}

export async function getOccupancyByUnit(filters?: DashboardFilters) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  const cacheKey = `${cacheKeys.occupancy(tenantId)}:${filters?.ownerId || 'all'}:${filters?.propertyId || 'all'}`

  return cache.getOrSet(
    cacheKey,
    async () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const daysInMonth = endOfMonth.getDate()

      const unitFilter = buildUnitFilter(filters)

      const units = await prisma.unit.findMany({
        where: {
          property: { tenantId },
          status: "ACTIVE",
          ...unitFilter,
        },
        include: {
          property: { select: { name: true } },
          reservations: {
            where: {
              checkinDate: { lte: endOfMonth },
              checkoutDate: { gte: startOfMonth },
              status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
            },
          },
        },
        take: 10,
      })

      return units.map((unit) => {
        let occupiedDays = 0

        for (const reservation of unit.reservations) {
          const checkin = new Date(Math.max(reservation.checkinDate.getTime(), startOfMonth.getTime()))
          const checkout = new Date(Math.min(reservation.checkoutDate.getTime(), endOfMonth.getTime()))
          const days = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))
          occupiedDays += Math.max(0, days)
        }

        const occupancy = (occupiedDays / daysInMonth) * 100
        const displayName = `${unit.property.name} - ${unit.name}`

        return {
          unit: displayName.length > 20 ? displayName.slice(0, 20) + "..." : displayName,
          occupancy: Math.min(100, occupancy),
        }
      })
    },
    TTL.MEDIUM
  )
}

type ReservationStatusCount = {
  name: string
  value: number
  color: string
}

export async function getReservationsByStatus(filters?: DashboardFilters): Promise<ReservationStatusCount[]> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  const cacheKey = `dashboard:reservations-status:${tenantId}:${filters?.ownerId || 'all'}:${filters?.propertyId || 'all'}`

  const unitFilter = buildUnitFilter(filters)

  return cache.getOrSet<ReservationStatusCount[]>(
    cacheKey,
    async () => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const statusCounts = await prisma.reservation.groupBy({
        by: ["status"],
        where: {
          tenantId,
          checkinDate: { gte: startOfMonth, lte: endOfMonth },
          unit: unitFilter,
        },
        _count: true,
      })

      const statusConfig: Record<string, { name: string; color: string }> = {
        PENDING: { name: "Pendente", color: "#fbbf24" },
        CONFIRMED: { name: "Confirmada", color: "#22c55e" },
        CHECKED_IN: { name: "Check-in", color: "#3b82f6" },
        CHECKED_OUT: { name: "Check-out", color: "#8b5cf6" },
        CANCELLED: { name: "Cancelada", color: "#ef4444" },
        NO_SHOW: { name: "No-show", color: "#f97316" },
      }

      return statusCounts.map((item) => ({
        name: statusConfig[item.status]?.name || item.status,
        value: item._count,
        color: statusConfig[item.status]?.color || "#6b7280",
      }))
    },
    TTL.MEDIUM
  )
}
