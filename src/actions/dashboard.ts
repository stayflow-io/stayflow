"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function getDashboardStats() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [
    propertiesCount,
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
    prisma.property.count({
      where: { tenantId, status: "ACTIVE", deletedAt: null },
    }),
    prisma.reservation.count({
      where: {
        tenantId,
        checkinDate: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
      },
    }),
    prisma.task.count({
      where: {
        tenantId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        scheduledDate: { gte: today, lt: tomorrow },
      },
    }),
    prisma.reservation.aggregate({
      where: {
        tenantId,
        checkinDate: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.reservation.findMany({
      where: {
        tenantId,
        checkinDate: { gte: tomorrow, lte: in7Days },
        status: "CONFIRMED",
      },
      include: { property: true },
      orderBy: { checkinDate: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        tenantId,
        scheduledDate: { gte: today, lt: tomorrow },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: { property: true },
      orderBy: { scheduledDate: "asc" },
      take: 5,
    }),
    prisma.reservation.findMany({
      where: {
        tenantId,
        checkinDate: { gte: today, lt: tomorrow },
        status: "CONFIRMED",
      },
      include: { property: true },
      orderBy: { checkinDate: "asc" },
    }),
    prisma.reservation.findMany({
      where: {
        tenantId,
        checkoutDate: { gte: today, lt: tomorrow },
        status: "CHECKED_IN",
      },
      include: { property: true },
      orderBy: { checkoutDate: "asc" },
    }),
    prisma.task.count({
      where: {
        tenantId,
        scheduledDate: { lt: today },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
    }),
    prisma.ownerPayout.count({
      where: {
        owner: { tenantId },
        status: "PENDING",
      },
    }),
  ])

  return {
    propertiesCount,
    reservationsThisMonth,
    pendingTasksCount,
    revenueThisMonth: revenueThisMonth._sum.totalAmount?.toNumber() || 0,
    upcomingCheckins,
    todayTasks,
    todayCheckins,
    todayCheckouts,
    overdueTasks,
    pendingPayouts,
  }
}

export async function getRevenueByMonth() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  const now = new Date()
  const months: { month: string; revenue: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const revenue = await prisma.reservation.aggregate({
      where: {
        tenantId,
        checkinDate: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
      },
      _sum: { totalAmount: true },
    })

    const monthName = date.toLocaleDateString("pt-BR", { month: "short" })
    months.push({
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      revenue: revenue._sum.totalAmount?.toNumber() || 0,
    })
  }

  return months
}

export async function getOccupancyByProperty() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysInMonth = endOfMonth.getDate()

  const properties = await prisma.property.findMany({
    where: { tenantId, status: "ACTIVE", deletedAt: null },
    include: {
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

  return properties.map((property) => {
    let occupiedDays = 0

    for (const reservation of property.reservations) {
      const checkin = new Date(Math.max(reservation.checkinDate.getTime(), startOfMonth.getTime()))
      const checkout = new Date(Math.min(reservation.checkoutDate.getTime(), endOfMonth.getTime()))
      const days = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))
      occupiedDays += Math.max(0, days)
    }

    const occupancy = (occupiedDays / daysInMonth) * 100

    return {
      property: property.name.length > 15 ? property.name.slice(0, 15) + "..." : property.name,
      occupancy: Math.min(100, occupancy),
    }
  })
}

export async function getReservationsByStatus() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const statusCounts = await prisma.reservation.groupBy({
    by: ["status"],
    where: {
      tenantId,
      checkinDate: { gte: startOfMonth, lte: endOfMonth },
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
}
