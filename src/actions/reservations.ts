"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { reservationSchema } from "@/lib/validations/reservation"
import { cache, cacheKeys } from "@/lib/redis"

const ITEMS_PER_PAGE = 15

export async function getReservations(filters?: {
  status?: string
  propertyId?: string
  ownerId?: string
  startDate?: Date
  endDate?: Date
  page?: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const page = filters?.page || 1
  const skip = (page - 1) * ITEMS_PER_PAGE

  const where: any = {
    tenantId: session.user.tenantId,
    ...(filters?.status && { status: filters.status as any }),
    ...(filters?.propertyId && { propertyId: filters.propertyId }),
    ...(filters?.ownerId && { property: { ownerId: filters.ownerId } }),
    ...(filters?.startDate && { checkinDate: { gte: filters.startDate } }),
    ...(filters?.endDate && { checkoutDate: { lte: filters.endDate } }),
  }

  const [items, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        property: true,
        channel: true,
      },
      orderBy: { checkinDate: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.reservation.count({ where }),
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

export async function getReservation(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.reservation.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
    include: {
      property: { include: { owner: true } },
      channel: true,
      events: { orderBy: { createdAt: "desc" } },
      tasks: true,
    },
  })
}

export async function createReservation(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const rawData = {
    propertyId: formData.get("propertyId"),
    guestName: formData.get("guestName"),
    guestEmail: formData.get("guestEmail") || undefined,
    guestPhone: formData.get("guestPhone") || undefined,
    checkinDate: formData.get("checkinDate"),
    checkoutDate: formData.get("checkoutDate"),
    numGuests: Number(formData.get("numGuests")),
    totalAmount: Number(formData.get("totalAmount")),
    cleaningFee: Number(formData.get("cleaningFee") || 0),
    channelFee: Number(formData.get("channelFee") || 0),
    notes: formData.get("notes") || undefined,
  }

  const validated = reservationSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const netAmount =
    validated.data.totalAmount -
    validated.data.channelFee -
    validated.data.cleaningFee

  const reservation = await prisma.reservation.create({
    data: {
      ...validated.data,
      netAmount,
      tenantId: session.user.tenantId,
    },
  })

  await prisma.reservationEvent.create({
    data: {
      reservationId: reservation.id,
      eventType: "CREATED",
      createdBy: session.user.id,
    },
  })

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.revenueByMonth(session.user.tenantId)),
    cache.del(cacheKeys.occupancy(session.user.tenantId)),
    cache.del(cacheKeys.reservationsByStatus(session.user.tenantId)),
    cache.del(cacheKeys.notifications(session.user.tenantId)),
    cache.delPattern(cacheKeys.calendarPattern(session.user.tenantId)),
  ])

  revalidatePath("/reservations")
  revalidatePath("/calendar")
  return { success: true, id: reservation.id }
}

export async function updateReservation(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const rawData = {
    propertyId: formData.get("propertyId"),
    guestName: formData.get("guestName"),
    guestEmail: formData.get("guestEmail") || undefined,
    guestPhone: formData.get("guestPhone") || undefined,
    checkinDate: formData.get("checkinDate"),
    checkoutDate: formData.get("checkoutDate"),
    numGuests: Number(formData.get("numGuests")),
    totalAmount: Number(formData.get("totalAmount")),
    cleaningFee: Number(formData.get("cleaningFee") || 0),
    channelFee: Number(formData.get("channelFee") || 0),
    notes: formData.get("notes") || undefined,
  }

  const validated = reservationSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const netAmount =
    validated.data.totalAmount -
    validated.data.channelFee -
    validated.data.cleaningFee

  await prisma.reservation.update({
    where: { id, tenantId: session.user.tenantId },
    data: {
      ...validated.data,
      netAmount,
    },
  })

  await prisma.reservationEvent.create({
    data: {
      reservationId: id,
      eventType: "UPDATED",
      createdBy: session.user.id,
    },
  })

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.revenueByMonth(session.user.tenantId)),
    cache.del(cacheKeys.occupancy(session.user.tenantId)),
    cache.del(cacheKeys.reservationsByStatus(session.user.tenantId)),
    cache.del(cacheKeys.notifications(session.user.tenantId)),
    cache.delPattern(cacheKeys.calendarPattern(session.user.tenantId)),
  ])

  revalidatePath("/reservations")
  revalidatePath(`/reservations/${id}`)
  revalidatePath("/calendar")
  return { success: true }
}

export async function updateReservationStatus(id: string, status: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const reservation = await prisma.reservation.update({
    where: { id, tenantId: session.user.tenantId },
    data: { status: status as any },
  })

  await prisma.reservationEvent.create({
    data: {
      reservationId: id,
      eventType: "STATUS_CHANGED",
      payload: { newStatus: status },
      createdBy: session.user.id,
    },
  })

  if (status === "CHECKED_OUT") {
    await prisma.task.create({
      data: {
        tenantId: session.user.tenantId,
        propertyId: reservation.propertyId,
        reservationId: id,
        type: "CLEANING",
        title: "Limpeza pos-checkout",
        scheduledDate: new Date(),
      },
    })
  }

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.revenueByMonth(session.user.tenantId)),
    cache.del(cacheKeys.occupancy(session.user.tenantId)),
    cache.del(cacheKeys.reservationsByStatus(session.user.tenantId)),
    cache.del(cacheKeys.notifications(session.user.tenantId)),
    cache.delPattern(cacheKeys.calendarPattern(session.user.tenantId)),
  ])

  revalidatePath("/reservations")
  revalidatePath(`/reservations/${id}`)
  revalidatePath("/tasks")
  return { success: true }
}

export async function deleteReservation(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.reservation.delete({
    where: { id, tenantId: session.user.tenantId },
  })

  // Invalidar caches afetados
  await Promise.all([
    cache.del(cacheKeys.dashboardStats(session.user.tenantId)),
    cache.del(cacheKeys.revenueByMonth(session.user.tenantId)),
    cache.del(cacheKeys.occupancy(session.user.tenantId)),
    cache.del(cacheKeys.reservationsByStatus(session.user.tenantId)),
    cache.del(cacheKeys.notifications(session.user.tenantId)),
    cache.delPattern(cacheKeys.calendarPattern(session.user.tenantId)),
  ])

  revalidatePath("/reservations")
  revalidatePath("/calendar")
  return { success: true }
}
