"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { taskSchema, taskUpdateSchema } from "@/lib/validations/task"
import { cache, cacheKeys } from "@/lib/redis"

const ITEMS_PER_PAGE = 20

export async function getTasks(filters?: {
  status?: string
  propertyId?: string
  ownerId?: string
  type?: string
  date?: Date
  page?: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const page = filters?.page || 1
  const skip = (page - 1) * ITEMS_PER_PAGE

  const dateFilter = filters?.date
    ? {
        scheduledDate: {
          gte: new Date(new Date(filters.date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(filters.date).setHours(23, 59, 59, 999)),
        },
      }
    : {}

  const where: any = {
    tenantId: session.user.tenantId,
    ...(filters?.status && { status: filters.status as any }),
    ...(filters?.propertyId && { propertyId: filters.propertyId }),
    ...(filters?.ownerId && { property: { ownerId: filters.ownerId } }),
    ...(filters?.type && { type: filters.type as any }),
    ...dateFilter,
  }

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        property: true,
        reservation: true,
        assignedTo: { select: { name: true } },
        checklist: true,
      },
      orderBy: { scheduledDate: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.task.count({ where }),
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

export async function getTask(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.task.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
    include: {
      property: true,
      reservation: true,
      assignedTo: { select: { id: true, name: true } },
      checklist: true,
    },
  })
}

export async function createTask(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const rawData = {
    propertyId: formData.get("propertyId"),
    reservationId: formData.get("reservationId") || undefined,
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
    scheduledDate: formData.get("scheduledDate"),
    notes: formData.get("notes") || undefined,
  }

  const validated = taskSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const task = await prisma.task.create({
    data: {
      ...validated.data,
      tenantId: session.user.tenantId,
    },
  })

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.notifications(session.user.tenantId)),
  ])

  revalidatePath("/tasks")
  return { success: true, id: task.id }
}

export async function updateTask(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const rawData = {
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
    scheduledDate: formData.get("scheduledDate") || undefined,
    notes: formData.get("notes") || undefined,
    status: formData.get("status") || undefined,
  }

  const validated = taskUpdateSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const updateData: any = { ...validated.data }

  if (validated.data.status === "COMPLETED") {
    updateData.completedAt = new Date()
  }

  await prisma.task.update({
    where: { id, tenantId: session.user.tenantId },
    data: updateData,
  })

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.notifications(session.user.tenantId)),
  ])

  revalidatePath("/tasks")
  return { success: true }
}

export async function completeTask(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.task.update({
    where: { id, tenantId: session.user.tenantId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  })

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.notifications(session.user.tenantId)),
  ])

  revalidatePath("/tasks")
  return { success: true }
}

export async function deleteTask(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.task.delete({
    where: { id, tenantId: session.user.tenantId },
  })

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.notifications(session.user.tenantId)),
  ])

  revalidatePath("/tasks")
  return { success: true }
}
