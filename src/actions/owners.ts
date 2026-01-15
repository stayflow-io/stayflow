"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { ownerSchema, ownerUpdateSchema } from "@/lib/validations/owner"
import { cache, cacheKeys, TTL } from "@/lib/redis"

type OwnerWithCount = {
  id: string
  name: string
  email: string
  phone: string | null
  _count: { properties: number; units: number }
  [key: string]: unknown
}

export async function getOwners(): Promise<OwnerWithCount[]> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId

  return cache.getOrSet<OwnerWithCount[]>(
    cacheKeys.owners(tenantId),
    async () => {
      const owners = await prisma.owner.findMany({
        where: {
          tenantId,
          deletedAt: null,
        },
        include: {
          _count: { select: { properties: true, units: true } },
        },
        orderBy: { name: "asc" },
      })
      // Serializar para evitar problemas com Dates
      return JSON.parse(JSON.stringify(owners))
    },
    TTL.MEDIUM
  )
}

export async function getOwner(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cache.getOrSet<any>(
    cacheKeys.owner(id),
    async () => {
      const owner = await prisma.owner.findFirst({
        where: {
          id,
          tenantId: session.user.tenantId,
          deletedAt: null,
        },
        include: {
          properties: {
            where: { deletedAt: null },
            include: {
              units: {
                where: { deletedAt: null },
                include: {
                  photos: { take: 1, orderBy: { order: "asc" } },
                },
              },
            },
            take: 50, // Limitar para evitar queries muito grandes
          },
          units: {
            where: { deletedAt: null },
            include: {
              property: { select: { id: true, name: true } },
              photos: { take: 1, orderBy: { order: "asc" } },
            },
            take: 50,
          },
          payouts: { orderBy: { periodEnd: "desc" }, take: 12 },
        },
      })
      return owner ? JSON.parse(JSON.stringify(owner)) : null
    },
    TTL.MEDIUM // 5 minutos
  )
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

  // Invalidar cache
  await cache.del(cacheKeys.owners(session.user.tenantId))

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

  // Invalidar cache
  await cache.del(cacheKeys.owners(session.user.tenantId))
  await cache.del(cacheKeys.owner(id))

  revalidatePath("/owners")
  revalidatePath(`/owners/${id}`)
  return { success: true }
}

export async function deleteOwner(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // Check if owner has properties or units
  const [propertiesCount, unitsCount] = await Promise.all([
    prisma.property.count({
      where: {
        ownerId: id,
        tenantId: session.user.tenantId,
        deletedAt: null,
      },
    }),
    prisma.unit.count({
      where: {
        ownerId: id,
        deletedAt: null,
      },
    }),
  ])

  if (propertiesCount > 0 || unitsCount > 0) {
    return { error: "Nao e possivel excluir proprietario com imoveis ou unidades vinculadas" }
  }

  await prisma.owner.update({
    where: { id, tenantId: session.user.tenantId },
    data: { deletedAt: new Date() },
  })

  // Invalidar cache
  await cache.del(cacheKeys.owners(session.user.tenantId))
  await cache.del(cacheKeys.owner(id))

  revalidatePath("/owners")
  return { success: true }
}
