"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function getTransactions(filters?: {
  propertyId?: string
  type?: string
  startDate?: Date
  endDate?: Date
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.transaction.findMany({
    where: {
      tenantId: session.user.tenantId,
      ...(filters?.propertyId && { propertyId: filters.propertyId }),
      ...(filters?.type && { type: filters.type as any }),
      ...(filters?.startDate && { date: { gte: filters.startDate } }),
      ...(filters?.endDate && { date: { lte: filters.endDate } }),
    },
    include: {
      property: true,
      reservation: true,
    },
    orderBy: { date: "desc" },
  })
}

export async function createTransaction(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const data = {
    propertyId: formData.get("propertyId") as string,
    reservationId: (formData.get("reservationId") as string) || null,
    type: formData.get("type") as "INCOME" | "EXPENSE",
    category: formData.get("category") as string,
    amount: Number(formData.get("amount")),
    date: new Date(formData.get("date") as string),
    description: (formData.get("description") as string) || null,
  }

  if (!data.propertyId || !data.type || !data.category || !data.amount) {
    return { error: "Campos obrigatorios nao preenchidos" }
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...data,
      tenantId: session.user.tenantId,
      createdById: session.user.id,
    },
  })

  revalidatePath("/financial")
  return { success: true, id: transaction.id }
}

export async function getFinancialSummary(startDate: Date, endDate: Date) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const transactions = await prisma.transaction.findMany({
    where: {
      tenantId: session.user.tenantId,
      date: { gte: startDate, lte: endDate },
    },
  })

  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0)

  return {
    income,
    expenses,
    net: income - expenses,
    transactionCount: transactions.length,
  }
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

  revalidatePath(`/owners/${data.ownerId}`)
  revalidatePath("/financial")
  return { success: true, id: payout.id }
}
