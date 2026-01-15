"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cache, cacheKeys, TTL } from "@/lib/redis"

export async function getTransactions(filters?: {
  unitId?: string
  propertyId?: string
  ownerId?: string
  type?: string
  startDate?: Date
  endDate?: Date
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    tenantId: session.user.tenantId,
    unit: { deletedAt: null },
    ...(filters?.unitId && { unitId: filters.unitId }),
    ...(filters?.propertyId && { unit: { propertyId: filters.propertyId } }),
    ...(filters?.type && { type: filters.type as any }),
    ...(filters?.startDate && filters?.endDate && {
      date: { gte: filters.startDate, lte: filters.endDate },
    }),
    ...(filters?.startDate && !filters?.endDate && { date: { gte: filters.startDate } }),
    ...(!filters?.startDate && filters?.endDate && { date: { lte: filters.endDate } }),
  }

  // Filter by owner - check both unit.ownerId and unit.property.ownerId
  if (filters?.ownerId) {
    where.OR = [
      { unit: { ownerId: filters.ownerId } },
      { unit: { ownerId: null, property: { ownerId: filters.ownerId } } },
    ]
  }

  return prisma.transaction.findMany({
    where,
    include: {
      unit: {
        include: {
          property: { select: { id: true, name: true, ownerId: true } },
          owner: { select: { id: true, name: true } },
        },
      },
      reservation: { select: { id: true, guestName: true } },
    },
    orderBy: { date: "desc" },
    take: 100, // Limitar para evitar queries muito grandes
  })
}

export async function createTransaction(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const data = {
    unitId: formData.get("unitId") as string,
    reservationId: (formData.get("reservationId") as string) || null,
    type: formData.get("type") as "INCOME" | "EXPENSE",
    category: formData.get("category") as string,
    amount: Number(formData.get("amount")),
    date: new Date(formData.get("date") as string),
    description: (formData.get("description") as string) || null,
  }

  if (!data.unitId || !data.type || !data.category || !data.amount) {
    return { error: "Campos obrigatorios nao preenchidos" }
  }

  // Verify unit belongs to tenant
  const unit = await prisma.unit.findFirst({
    where: {
      id: data.unitId,
      property: { tenantId: session.user.tenantId },
      deletedAt: null,
    },
  })

  if (!unit) {
    return { error: "Unidade nao encontrada" }
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...data,
      tenantId: session.user.tenantId,
      createdById: session.user.id,
    },
  })

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.revenueByMonth(session.user.tenantId)),
    cache.delPattern(`financial:summary:${session.user.tenantId}:*`),
  ])

  revalidatePath("/financial")
  return { success: true, id: transaction.id }
}

type FinancialSummary = {
  income: number
  expenses: number
  net: number
  transactionCount: number
}

export async function getFinancialSummary(startDate: Date, endDate: Date): Promise<FinancialSummary> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  const startKey = startDate.toISOString().split('T')[0]
  const endKey = endDate.toISOString().split('T')[0]

  return cache.getOrSet<FinancialSummary>(
    `financial:summary:${tenantId}:${startKey}:${endKey}`,
    async () => {
      // Usar agregação SQL em vez de processar no JavaScript
      const [incomeResult, expenseResult, countResult] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            tenantId,
            type: "INCOME",
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            tenantId,
            type: "EXPENSE",
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.count({
          where: {
            tenantId,
            date: { gte: startDate, lte: endDate },
          },
        }),
      ])

      const income = Number(incomeResult._sum.amount || 0)
      const expenses = Number(expenseResult._sum.amount || 0)

      return {
        income,
        expenses,
        net: income - expenses,
        transactionCount: countResult,
      }
    },
    TTL.MEDIUM
  )
}

export async function getOwnerPayouts(ownerId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.ownerPayout.findMany({
    where: {
      owner: {
        id: ownerId,
        tenantId: session.user.tenantId,
      },
    },
    orderBy: { periodEnd: "desc" },
  })
}

export async function createOwnerPayout(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const data = {
    ownerId: formData.get("ownerId") as string,
    periodStart: new Date(formData.get("periodStart") as string),
    periodEnd: new Date(formData.get("periodEnd") as string),
    grossAmount: Number(formData.get("grossAmount")),
    expenses: Number(formData.get("expenses")),
    adminFee: Number(formData.get("adminFee")),
    netAmount: Number(formData.get("netAmount")),
  }

  if (!data.ownerId || !data.periodStart || !data.periodEnd) {
    return { error: "Campos obrigatorios nao preenchidos" }
  }

  const payout = await prisma.ownerPayout.create({
    data,
  })

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.notifications(session.user.tenantId)),
    cache.del(cacheKeys.owner(data.ownerId)),
  ])

  revalidatePath(`/owners/${data.ownerId}`)
  revalidatePath("/financial")
  return { success: true, id: payout.id }
}
