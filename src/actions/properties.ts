"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { propertySchema } from "@/lib/validations/property"
import { revalidatePath } from "next/cache"
import { cache, cacheKeys, TTL } from "@/lib/redis"

export async function createProperty(data: any) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const validated = propertySchema.parse(data)

  const property = await prisma.property.create({
    data: {
      ...validated,
      tenantId: session.user.tenantId,
    },
  })

  // Invalidar cache
  await cache.del(cacheKeys.properties(session.user.tenantId))

  revalidatePath("/properties")
  return { success: true, id: property.id }
}

const ITEMS_PER_PAGE = 12

export async function getProperties(filters?: {
  status?: string
  ownerId?: string
  page?: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const page = filters?.page || 1
  const skip = (page - 1) * ITEMS_PER_PAGE

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    tenantId: session.user.tenantId,
    deletedAt: null,
    ...(filters?.status && { status: filters.status }),
  }

  // Filter by owner - check both property.ownerId and units with that ownerId
  if (filters?.ownerId) {
    where.OR = [
      { ownerId: filters.ownerId },
      { units: { some: { ownerId: filters.ownerId } } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        units: {
          where: { deletedAt: null },
          include: {
            photos: { take: 1, orderBy: { order: "asc" } },
            owner: { select: { id: true, name: true } },
          },
        },
        _count: { select: { units: { where: { deletedAt: null } } } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.property.count({ where }),
  ])

  return {
    items,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      totalItems: total,
      itemsPerPage: ITEMS_PER_PAGE,
    },
  }
}

type PropertyBasic = {
  id: string
  name: string
  ownerId: string | null
  [key: string]: unknown
}

export async function getAllProperties(): Promise<PropertyBasic[]> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId

  return cache.getOrSet<PropertyBasic[]>(
    cacheKeys.properties(tenantId),
    async () => {
      const properties = await prisma.property.findMany({
        where: {
          tenantId,
          deletedAt: null,
        },
        orderBy: { name: "asc" },
      })
      return JSON.parse(JSON.stringify(properties))
    },
    TTL.MEDIUM
  )
}

export async function getPropertyById(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cache.getOrSet<any>(
    cacheKeys.property(id),
    async () => {
      const property = await prisma.property.findFirst({
        where: {
          id,
          tenantId: session.user.tenantId,
          deletedAt: null,
        },
        include: {
          owner: true,
          units: {
            where: { deletedAt: null },
            include: {
              photos: { orderBy: { order: "asc" } },
              owner: { select: { id: true, name: true } },
              _count: { select: { reservations: true } },
            },
            orderBy: { name: "asc" },
          },
          channels: { include: { channel: true } },
        },
      })
      return property ? JSON.parse(JSON.stringify(property)) : null
    },
    TTL.MEDIUM
  )
}

export async function updateProperty(id: string, data: any) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const validated = propertySchema.parse(data)

  const property = await prisma.property.update({
    where: { id, tenantId: session.user.tenantId },
    data: validated,
  })

  // Invalidar cache
  await Promise.all([
    cache.del(cacheKeys.properties(session.user.tenantId)),
    cache.del(cacheKeys.property(id)),
    cache.del(cacheKeys.units(session.user.tenantId)),
  ])

  revalidatePath("/properties")
  revalidatePath(`/properties/${id}`)
  return { success: true, id: property.id }
}

export async function deleteProperty(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // Check if property has any units with reservations
  const property = await prisma.property.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: {
      units: {
        where: { deletedAt: null },
        include: {
          _count: { select: { reservations: true } },
        },
      },
    },
  })

  if (!property) {
    return { error: "Propriedade nao encontrada" }
  }

  const hasReservations = property.units.some((u) => u._count.reservations > 0)
  if (hasReservations) {
    return { error: "Nao e possivel excluir propriedade com unidades que tem reservas" }
  }

  // Soft delete property and all its units
  await prisma.$transaction([
    prisma.unit.updateMany({
      where: { propertyId: id },
      data: { deletedAt: new Date() },
    }),
    prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    }),
  ])

  // Invalidar cache
  await Promise.all([
    cache.del(cacheKeys.properties(session.user.tenantId)),
    cache.del(cacheKeys.property(id)),
    cache.del(cacheKeys.units(session.user.tenantId)),
  ])

  revalidatePath("/properties")
  return { success: true }
}
