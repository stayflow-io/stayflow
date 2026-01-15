"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cache, cacheKeys, TTL } from "@/lib/redis"

// Note: getEffectiveOwnerId is available at @/lib/utils/ownership
// It's a sync utility function that can't be exported from a "use server" file

const ITEMS_PER_PAGE = 20

type UnitBasic = {
  id: string
  propertyId: string
  ownerId: string | null
  name: string
  bedrooms: number
  bathrooms: number
  maxGuests: number
  cleaningFee: number | string
  adminFeePercent: number | string
  status: string
  property: {
    id: string
    name: string
    ownerId: string | null
  }
  [key: string]: unknown
}

export async function getUnits(filters?: {
  propertyId?: string
  ownerId?: string
  status?: string
  page?: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const page = filters?.page || 1
  const skip = (page - 1) * ITEMS_PER_PAGE

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    property: { tenantId: session.user.tenantId },
    deletedAt: null,
    ...(filters?.propertyId && { propertyId: filters.propertyId }),
    ...(filters?.status && { status: filters.status }),
  }

  // Filter by owner - check both unit.ownerId and property.ownerId
  if (filters?.ownerId) {
    where.OR = [
      { ownerId: filters.ownerId },
      { ownerId: null, property: { ownerId: filters.ownerId } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.unit.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true, ownerId: true },
        },
        owner: {
          select: { id: true, name: true },
        },
        photos: { take: 1, orderBy: { order: "asc" } },
        _count: { select: { reservations: true } },
      },
      orderBy: [{ property: { name: "asc" } }, { name: "asc" }],
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.unit.count({ where }),
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

export async function getUnit(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cache.getOrSet<any>(
    cacheKeys.unit(id),
    async () => {
      const unit = await prisma.unit.findFirst({
        where: {
          id,
          property: { tenantId: session.user.tenantId },
          deletedAt: null,
        },
        include: {
          property: {
            select: { id: true, name: true, ownerId: true, address: true, city: true, state: true },
          },
          owner: true,
          photos: { orderBy: { order: "asc" } },
        },
      })
      return unit ? JSON.parse(JSON.stringify(unit)) : null
    },
    TTL.MEDIUM
  )
}

export async function getUnitsByProperty(propertyId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.unit.findMany({
    where: {
      propertyId,
      property: { tenantId: session.user.tenantId },
      deletedAt: null,
    },
    include: {
      property: { select: { id: true, name: true, ownerId: true } },
      owner: { select: { id: true, name: true } },
      photos: { take: 1, orderBy: { order: "asc" } },
    },
    orderBy: { name: "asc" },
  })
}

export async function getAllUnits(): Promise<UnitBasic[]> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId

  return cache.getOrSet<UnitBasic[]>(
    cacheKeys.units(tenantId),
    async () => {
      const units = await prisma.unit.findMany({
        where: {
          property: { tenantId },
          deletedAt: null,
        },
        include: {
          property: { select: { id: true, name: true, ownerId: true } },
        },
        orderBy: [{ property: { name: "asc" } }, { name: "asc" }],
      })
      return JSON.parse(JSON.stringify(units))
    },
    TTL.MEDIUM
  )
}

export async function createUnit(propertyId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // Verify property belongs to tenant
  const property = await prisma.property.findFirst({
    where: { id: propertyId, tenantId: session.user.tenantId },
  })

  if (!property) {
    return { error: "Propriedade nao encontrada" }
  }

  const ownerIdValue = formData.get("ownerId") as string
  const data = {
    propertyId,
    ownerId: ownerIdValue && ownerIdValue !== "inherit" ? ownerIdValue : null,
    name: formData.get("name") as string,
    bedrooms: Number(formData.get("bedrooms")),
    bathrooms: Number(formData.get("bathrooms")),
    maxGuests: Number(formData.get("maxGuests")),
    description: (formData.get("description") as string) || null,
    amenities: formData.get("amenities")
      ? (formData.get("amenities") as string).split(",").map((a) => a.trim())
      : [],
    cleaningFee: Number(formData.get("cleaningFee") || 0),
    adminFeePercent: Number(formData.get("adminFeePercent") || 20),
  }

  if (!data.name || !data.bedrooms || !data.maxGuests) {
    return { error: "Campos obrigatorios nao preenchidos" }
  }

  const unit = await prisma.unit.create({ data })

  // Invalidate caches
  await Promise.all([
    cache.del(cacheKeys.units(session.user.tenantId)),
    cache.del(cacheKeys.property(propertyId)),
  ])

  revalidatePath(`/properties/${propertyId}`)
  revalidatePath("/properties")
  return { success: true, id: unit.id }
}

export async function updateUnit(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const unit = await prisma.unit.findFirst({
    where: {
      id,
      property: { tenantId: session.user.tenantId },
    },
  })

  if (!unit) {
    return { error: "Unidade nao encontrada" }
  }

  const statusValue = formData.get("status") as string | null
  const ownerIdValue = formData.get("ownerId") as string

  await prisma.unit.update({
    where: { id },
    data: {
      ownerId: ownerIdValue && ownerIdValue !== "inherit" ? ownerIdValue : null,
      name: formData.get("name") as string,
      bedrooms: Number(formData.get("bedrooms")),
      bathrooms: Number(formData.get("bathrooms")),
      maxGuests: Number(formData.get("maxGuests")),
      description: (formData.get("description") as string) || null,
      amenities: formData.get("amenities")
        ? (formData.get("amenities") as string).split(",").map((a) => a.trim())
        : [],
      cleaningFee: Number(formData.get("cleaningFee") || 0),
      adminFeePercent: Number(formData.get("adminFeePercent") || 20),
      ...(statusValue && { status: statusValue as "ACTIVE" | "INACTIVE" | "MAINTENANCE" }),
    },
  })

  // Invalidate caches
  await Promise.all([
    cache.del(cacheKeys.units(session.user.tenantId)),
    cache.del(cacheKeys.unit(id)),
    cache.del(cacheKeys.property(unit.propertyId)),
  ])

  revalidatePath(`/properties/${unit.propertyId}`)
  revalidatePath(`/properties/${unit.propertyId}/units/${id}`)
  return { success: true }
}

export async function deleteUnit(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const unit = await prisma.unit.findFirst({
    where: {
      id,
      property: { tenantId: session.user.tenantId },
    },
    include: {
      _count: { select: { reservations: true } },
    },
  })

  if (!unit) {
    return { error: "Unidade nao encontrada" }
  }

  if (unit._count.reservations > 0) {
    return { error: "Nao e possivel excluir unidade com reservas" }
  }

  // Soft delete
  await prisma.unit.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  // Invalidate caches
  await Promise.all([
    cache.del(cacheKeys.units(session.user.tenantId)),
    cache.del(cacheKeys.unit(id)),
    cache.del(cacheKeys.property(unit.propertyId)),
  ])

  revalidatePath(`/properties/${unit.propertyId}`)
  return { success: true }
}

// ==================== PHOTOS ====================

export async function addUnitPhoto(unitId: string, url: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      property: { tenantId: session.user.tenantId },
    },
  })

  if (!unit) {
    return { error: "Unidade nao encontrada" }
  }

  // Get max order
  const lastPhoto = await prisma.unitPhoto.findFirst({
    where: { unitId },
    orderBy: { order: "desc" },
  })

  const photo = await prisma.unitPhoto.create({
    data: {
      unitId,
      url,
      order: (lastPhoto?.order || 0) + 1,
    },
  })

  // Invalidate cache
  await cache.del(cacheKeys.unit(unitId))
  revalidatePath(`/properties/${unit.propertyId}/units/${unitId}`)

  return { success: true, photo }
}

export async function removeUnitPhoto(photoId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const photo = await prisma.unitPhoto.findFirst({
    where: { id: photoId },
    include: {
      unit: {
        include: {
          property: { select: { tenantId: true, id: true } },
        },
      },
    },
  })

  if (!photo || photo.unit.property.tenantId !== session.user.tenantId) {
    return { error: "Foto nao encontrada" }
  }

  await prisma.unitPhoto.delete({ where: { id: photoId } })

  // Invalidate cache
  await cache.del(cacheKeys.unit(photo.unitId))
  revalidatePath(`/properties/${photo.unit.property.id}/units/${photo.unitId}`)

  return { success: true }
}

export async function reorderUnitPhotos(unitId: string, photoIds: string[]) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      property: { tenantId: session.user.tenantId },
    },
  })

  if (!unit) {
    return { error: "Unidade nao encontrada" }
  }

  // Update order for each photo
  await Promise.all(
    photoIds.map((id, index) =>
      prisma.unitPhoto.update({
        where: { id },
        data: { order: index },
      })
    )
  )

  // Invalidate cache
  await cache.del(cacheKeys.unit(unitId))
  revalidatePath(`/properties/${unit.propertyId}/units/${unitId}`)

  return { success: true }
}
