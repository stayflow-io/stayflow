"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ownerSchema, ownerUpdateSchema } from "@/lib/validations/owner"

export async function getOwners() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.owner.findMany({
    where: {
      tenantId: session.user.tenantId,
      deletedAt: null,
    },
    include: {
      _count: { select: { properties: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function getOwner(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.owner.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
      deletedAt: null,
    },
    include: {
      properties: {
        where: { deletedAt: null },
        include: {
          photos: { take: 1, orderBy: { order: "asc" } },
        },
      },
      payouts: { orderBy: { periodEnd: "desc" }, take: 12 },
    },
  })
}

export async function createOwner(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const bankAccountData = formData.get("bankAccount")
  let bankAccount = undefined
  if (bankAccountData) {
    try {
      bankAccount = JSON.parse(bankAccountData as string)
    } catch {
      // ignore invalid JSON
    }
  }

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    document: formData.get("document") || undefined,
    pixKey: formData.get("pixKey") || undefined,
    bankAccount,
    commissionPercent: Number(formData.get("commissionPercent") || 20),
  }

  const validated = ownerSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const owner = await prisma.owner.create({
    data: {
      ...validated.data,
      tenantId: session.user.tenantId,
    },
  })

  revalidatePath("/owners")
  return { success: true, id: owner.id }
}

export async function updateOwner(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const bankAccountData = formData.get("bankAccount")
  let bankAccount = undefined
  if (bankAccountData) {
    try {
      bankAccount = JSON.parse(bankAccountData as string)
    } catch {
      // ignore invalid JSON
    }
  }

  const rawData = {
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    document: formData.get("document") || undefined,
    pixKey: formData.get("pixKey") || undefined,
    bankAccount,
    commissionPercent: formData.get("commissionPercent")
      ? Number(formData.get("commissionPercent"))
      : undefined,
  }

  const validated = ownerUpdateSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  await prisma.owner.update({
    where: { id, tenantId: session.user.tenantId },
    data: validated.data,
  })

  revalidatePath("/owners")
  revalidatePath(`/owners/${id}`)
  return { success: true }
}

export async function deleteOwner(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const propertiesCount = await prisma.property.count({
    where: {
      ownerId: id,
      tenantId: session.user.tenantId,
      deletedAt: null,
    },
  })

  if (propertiesCount > 0) {
    return { error: "Nao e possivel excluir proprietario com imoveis vinculados" }
  }

  await prisma.owner.update({
    where: { id, tenantId: session.user.tenantId },
    data: { deletedAt: new Date() },
  })

  revalidatePath("/owners")
  return { success: true }
}
