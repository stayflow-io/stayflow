"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { propertySchema } from "@/lib/validations/property"
import { revalidatePath } from "next/cache"

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

  revalidatePath("/dashboard/properties")
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

  const where = {
    tenantId: session.user.tenantId,
    deletedAt: null,
    ...(filters?.status && { status: filters.status }),
    ...(filters?.ownerId && { ownerId: filters.ownerId }),
  }

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        owner: true,
        photos: { orderBy: { order: "asc" }, take: 1 },
        _count: { select: { reservations: true } },
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

export async function getAllProperties() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.property.findMany({
    where: {
      tenantId: session.user.tenantId,
      deletedAt: null,
    },
    orderBy: { name: "asc" },
  })
}

export async function getPropertyById(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.property.findUnique({
    where: { id },
    include: {
      owner: true,
      photos: true,
      channels: true,
    },
  })
}

export async function updateProperty(id: string, data: any) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const validated = propertySchema.parse(data)

  const property = await prisma.property.update({
    where: { id, tenantId: session.user.tenantId },
    data: validated,
  })

  revalidatePath("/dashboard/properties")
  return { success: true, id: property.id }
}

export async function deleteProperty(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.property.update({
    where: { id, tenantId: session.user.tenantId },
    data: { deletedAt: new Date() },
  })

  revalidatePath("/dashboard/properties")
  return { success: true }
}
