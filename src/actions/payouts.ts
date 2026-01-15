"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cache, cacheKeys } from "@/lib/redis"
import { getEffectiveOwnerId } from "@/lib/utils/ownership"

export async function getPayouts(filters?: { ownerId?: string; status?: string }) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.ownerPayout.findMany({
    where: {
      owner: { tenantId: session.user.tenantId },
      ...(filters?.ownerId && { ownerId: filters.ownerId }),
      ...(filters?.status && { status: filters.status as any }),
    },
    include: {
      owner: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPayout(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.ownerPayout.findFirst({
    where: {
      id,
      owner: { tenantId: session.user.tenantId },
    },
    include: {
      owner: true,
    },
  })
}

export async function calculatePayoutPreview(ownerId: string, periodStart: Date, periodEnd: Date) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // Buscar proprietário e unidades que pertencem a ele (diretamente ou via property)
  const [owner, directUnits, propertiesWithUnits] = await Promise.all([
    prisma.owner.findFirst({
      where: { id: ownerId, tenantId: session.user.tenantId },
    }),
    // Units directly owned by this owner
    prisma.unit.findMany({
      where: { ownerId, deletedAt: null },
      select: { id: true, adminFeePercent: true },
    }),
    // Properties owned by this owner (units without their own owner inherit from property)
    prisma.property.findMany({
      where: { ownerId, tenantId: session.user.tenantId, deletedAt: null },
      include: {
        units: {
          where: { ownerId: null, deletedAt: null },
          select: { id: true, adminFeePercent: true },
        },
      },
    }),
  ])

  if (!owner) {
    return { error: "Proprietario nao encontrado" }
  }

  // Combine all units that belong to this owner
  const inheritedUnits = propertiesWithUnits.flatMap((p) => p.units)
  const allUnits = [...directUnits, ...inheritedUnits]
  const unitIds = allUnits.map((u) => u.id)

  // Se não houver unidades, retornar zerado
  if (unitIds.length === 0) {
    return {
      success: true,
      preview: {
        grossAmount: 0,
        expenses: 0,
        adminFee: 0,
        netAmount: 0,
        reservationsCount: 0,
        expensesCount: 0,
        commissionPercent: Number(owner.commissionPercent),
      },
    }
  }

  // Buscar reservas e despesas em paralelo
  const [reservations, expenses] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        unitId: { in: unitIds },
        status: "CHECKED_OUT",
        checkoutDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        netAmount: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        unitId: { in: unitIds },
        type: "EXPENSE",
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        amount: true,
      },
    }),
  ])

  // Calcular valores
  const grossAmount = reservations.reduce((sum, r) => sum + Number(r.netAmount), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const avgAdminFee = allUnits.length > 0
    ? allUnits.reduce((sum, u) => sum + Number(u.adminFeePercent), 0) / allUnits.length
    : 20
  const adminFee = (grossAmount * avgAdminFee) / 100
  const netAmount = grossAmount - totalExpenses - adminFee

  return {
    success: true,
    preview: {
      grossAmount,
      expenses: totalExpenses,
      adminFee,
      netAmount,
      reservationsCount: reservations.length,
      expensesCount: expenses.length,
      commissionPercent: Number(owner.commissionPercent),
    },
  }
}

export async function createPayout(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const ownerId = formData.get("ownerId") as string
  const periodStart = new Date(formData.get("periodStart") as string)
  const periodEnd = new Date(formData.get("periodEnd") as string)
  const grossAmount = Number(formData.get("grossAmount"))
  const expenses = Number(formData.get("expenses"))
  const adminFee = Number(formData.get("adminFee"))
  const netAmount = Number(formData.get("netAmount"))

  // Verificar se proprietário pertence ao tenant
  const owner = await prisma.owner.findFirst({
    where: { id: ownerId, tenantId: session.user.tenantId },
  })

  if (!owner) {
    return { error: "Proprietario nao encontrado" }
  }

  const payout = await prisma.ownerPayout.create({
    data: {
      ownerId,
      periodStart,
      periodEnd,
      grossAmount,
      expenses,
      adminFee,
      netAmount,
      status: "PENDING",
    },
  })

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.notifications(session.user.tenantId)),
  ])

  revalidatePath("/financial/payouts")
  revalidatePath(`/owners/${ownerId}`)
  return { success: true, id: payout.id }
}

export async function updatePayoutStatus(id: string, status: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const payout = await prisma.ownerPayout.findFirst({
    where: { id, owner: { tenantId: session.user.tenantId } },
  })

  if (!payout) {
    return { error: "Repasse nao encontrado" }
  }

  await prisma.ownerPayout.update({
    where: { id },
    data: {
      status: status as any,
      ...(status === "PAID" && { paidAt: new Date() }),
    },
  })

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.notifications(session.user.tenantId)),
  ])

  revalidatePath("/financial/payouts")
  revalidatePath(`/owners/${payout.ownerId}`)
  return { success: true }
}

export async function deletePayout(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const payout = await prisma.ownerPayout.findFirst({
    where: { id, owner: { tenantId: session.user.tenantId } },
  })

  if (!payout) {
    return { error: "Repasse nao encontrado" }
  }

  if (payout.status === "PAID") {
    return { error: "Nao e possivel excluir um repasse ja pago" }
  }

  await prisma.ownerPayout.delete({
    where: { id },
  })

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.notifications(session.user.tenantId)),
  ])

  revalidatePath("/financial/payouts")
  return { success: true }
}
