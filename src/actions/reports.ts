"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { startOfMonth, endOfMonth, subMonths } from "date-fns"

export interface OwnerReportData {
  ownerName: string
  periodStart: Date
  periodEnd: Date
  properties: {
    name: string
    reservations: {
      guestName: string
      checkinDate: Date
      checkoutDate: Date
      totalAmount: number
      channelFee: number
      cleaningFee: number
      netAmount: number
    }[]
    expenses: {
      description: string
      date: Date
      amount: number
    }[]
    totalRevenue: number
    totalExpenses: number
  }[]
  grossAmount: number
  totalExpenses: number
  adminFee: number
  adminFeePercent: number
  netAmount: number
}

export async function getOwnerReportData(
  ownerId: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<OwnerReportData | null> {
  const session = await auth()
  if (!session?.user?.tenantId) return null

  const start = periodStart || startOfMonth(subMonths(new Date(), 1))
  const end = periodEnd || endOfMonth(subMonths(new Date(), 1))

  const owner = await prisma.owner.findFirst({
    where: {
      id: ownerId,
      tenantId: session.user.tenantId,
    },
    include: {
      properties: {
        include: {
          reservations: {
            where: {
              checkoutDate: {
                gte: start,
                lte: end,
              },
              status: {
                in: ["CHECKED_OUT", "CONFIRMED"],
              },
            },
            orderBy: {
              checkinDate: "asc",
            },
          },
          transactions: {
            where: {
              type: "EXPENSE",
              date: {
                gte: start,
                lte: end,
              },
            },
            orderBy: {
              date: "asc",
            },
          },
        },
      },
    },
  })

  if (!owner) return null

  let grossAmount = 0
  let totalExpenses = 0

  const properties = owner.properties.map((property) => {
    const propertyRevenue = property.reservations.reduce(
      (sum, r) => sum + Number(r.netAmount),
      0
    )
    const propertyExpenses = property.transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    )

    grossAmount += propertyRevenue
    totalExpenses += propertyExpenses

    return {
      name: property.name,
      reservations: property.reservations.map((r) => ({
        guestName: r.guestName,
        checkinDate: r.checkinDate,
        checkoutDate: r.checkoutDate,
        totalAmount: Number(r.totalAmount),
        channelFee: Number(r.channelFee),
        cleaningFee: Number(r.cleaningFee),
        netAmount: Number(r.netAmount),
      })),
      expenses: property.transactions.map((t) => ({
        description: t.description || t.category,
        date: t.date,
        amount: Number(t.amount),
      })),
      totalRevenue: propertyRevenue,
      totalExpenses: propertyExpenses,
    }
  })

  const adminFeePercent = Number(owner.commissionPercent)
  const adminFee = (grossAmount - totalExpenses) * (adminFeePercent / 100)
  const netAmount = grossAmount - totalExpenses - adminFee

  return {
    ownerName: owner.name,
    periodStart: start,
    periodEnd: end,
    properties,
    grossAmount,
    totalExpenses,
    adminFee,
    adminFeePercent,
    netAmount,
  }
}

export interface ReservationsReportData {
  periodStart: Date
  periodEnd: Date
  reservations: {
    property: string
    guestName: string
    checkinDate: Date
    checkoutDate: Date
    nights: number
    totalAmount: number
    status: string
  }[]
  totals: {
    reservations: number
    nights: number
    revenue: number
  }
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmada",
  CHECKED_IN: "Check-in",
  CHECKED_OUT: "Check-out",
  CANCELLED: "Cancelada",
  NO_SHOW: "No-show",
}

export async function getReservationsReportData(
  periodStart?: Date,
  periodEnd?: Date
): Promise<ReservationsReportData | null> {
  const session = await auth()
  if (!session?.user?.tenantId) return null

  const start = periodStart || startOfMonth(new Date())
  const end = periodEnd || endOfMonth(new Date())

  const reservations = await prisma.reservation.findMany({
    where: {
      tenantId: session.user.tenantId,
      checkinDate: {
        lte: end,
      },
      checkoutDate: {
        gte: start,
      },
    },
    include: {
      property: true,
    },
    orderBy: {
      checkinDate: "asc",
    },
  })

  const mapped = reservations.map((r) => {
    const nights = Math.ceil(
      (r.checkoutDate.getTime() - r.checkinDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    return {
      property: r.property.name,
      guestName: r.guestName,
      checkinDate: r.checkinDate,
      checkoutDate: r.checkoutDate,
      nights,
      totalAmount: Number(r.totalAmount),
      status: statusLabels[r.status] || r.status,
    }
  })

  const totals = {
    reservations: mapped.length,
    nights: mapped.reduce((sum, r) => sum + r.nights, 0),
    revenue: mapped.reduce((sum, r) => sum + r.totalAmount, 0),
  }

  return {
    periodStart: start,
    periodEnd: end,
    reservations: mapped,
    totals,
  }
}

export async function getRevenueForecast() {
  const session = await auth()
  if (!session?.user?.tenantId) return null

  const today = new Date()
  const endOfYear = new Date(today.getFullYear(), 11, 31)

  // Get confirmed reservations for rest of year
  const upcomingReservations = await prisma.reservation.findMany({
    where: {
      tenantId: session.user.tenantId,
      status: { in: ["CONFIRMED", "PENDING"] },
      checkinDate: {
        gte: today,
        lte: endOfYear,
      },
    },
    include: {
      property: true,
    },
    orderBy: {
      checkinDate: "asc",
    },
  })

  // Group by month
  const monthlyForecast: Record<string, { revenue: number; reservations: number }> = {}

  for (const reservation of upcomingReservations) {
    const month = `${reservation.checkinDate.getFullYear()}-${String(reservation.checkinDate.getMonth() + 1).padStart(2, "0")}`
    if (!monthlyForecast[month]) {
      monthlyForecast[month] = { revenue: 0, reservations: 0 }
    }
    monthlyForecast[month].revenue += Number(reservation.netAmount)
    monthlyForecast[month].reservations += 1
  }

  // Convert to array
  const forecast = Object.entries(monthlyForecast)
    .map(([month, data]) => ({
      month,
      ...data,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  const totalRevenue = forecast.reduce((sum, m) => sum + m.revenue, 0)
  const totalReservations = forecast.reduce((sum, m) => sum + m.reservations, 0)

  return {
    forecast,
    totals: {
      revenue: totalRevenue,
      reservations: totalReservations,
    },
  }
}
