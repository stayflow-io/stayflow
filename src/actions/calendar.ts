"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { cache, TTL } from "@/lib/redis"

type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  type: "reservation" | "block"
  status?: string
  unitId: string
  unitName: string
  propertyId: string
  propertyName: string
  guestName?: string
  channel?: string
}

type CalendarEventsResult = {
  reservations: CalendarEvent[]
  blocks: CalendarEvent[]
}

export async function getCalendarEvents(
  startDate: Date,
  endDate: Date,
  filters?: { propertyId?: string; unitId?: string }
): Promise<CalendarEventsResult> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  // Criar chave de cache com base nos parâmetros
  const startKey = startDate.toISOString().split('T')[0]
  const endKey = endDate.toISOString().split('T')[0]
  const cacheKey = `calendar:${tenantId}:${startKey}:${endKey}:${filters?.propertyId || 'all'}:${filters?.unitId || 'all'}`

  return cache.getOrSet<CalendarEventsResult>(
    cacheKey,
    async () => {
      const [reservations, blocks] = await Promise.all([
        prisma.reservation.findMany({
          where: {
            tenantId,
            unit: {
              deletedAt: null,
              ...(filters?.unitId && { id: filters.unitId }),
              ...(filters?.propertyId && { propertyId: filters.propertyId }),
            },
            OR: [
              { checkinDate: { gte: startDate, lte: endDate } },
              { checkoutDate: { gte: startDate, lte: endDate } },
              {
                AND: [
                  { checkinDate: { lte: startDate } },
                  { checkoutDate: { gte: endDate } },
                ],
              },
            ],
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
          },
          include: {
            unit: {
              include: {
                property: { select: { id: true, name: true } },
              },
            },
            channel: { select: { name: true } },
          },
        }),
        prisma.calendarBlock.findMany({
          where: {
            unit: {
              deletedAt: null,
              property: { tenantId },
              ...(filters?.unitId && { id: filters.unitId }),
              ...(filters?.propertyId && { propertyId: filters.propertyId }),
            },
            OR: [
              { startDate: { gte: startDate, lte: endDate } },
              { endDate: { gte: startDate, lte: endDate } },
              {
                AND: [
                  { startDate: { lte: startDate } },
                  { endDate: { gte: endDate } },
                ],
              },
            ],
          },
          include: {
            unit: {
              include: {
                property: { select: { id: true, name: true } },
              },
            },
          },
        }),
      ])

      const result = {
        reservations: reservations.map((r) => ({
          id: r.id,
          title: `${r.guestName} - ${r.unit.property.name} - ${r.unit.name}`,
          start: r.checkinDate,
          end: r.checkoutDate,
          type: "reservation" as const,
          status: r.status,
          unitId: r.unitId,
          unitName: r.unit.name,
          propertyId: r.unit.property.id,
          propertyName: r.unit.property.name,
          guestName: r.guestName,
          channel: r.channel?.name,
        })),
        blocks: blocks.map((b) => ({
          id: b.id,
          title: b.reason || "Bloqueado",
          start: b.startDate,
          end: b.endDate,
          type: "block" as const,
          unitId: b.unitId,
          unitName: b.unit.name,
          propertyId: b.unit.property.id,
          propertyName: b.unit.property.name,
        })),
      }

      return JSON.parse(JSON.stringify(result))
    },
    TTL.SHORT // 60 segundos - calendário pode mudar frequentemente
  )
}

// Invalidar cache do calendário
export async function invalidateCalendarCache(tenantId: string): Promise<void> {
  await cache.delPattern(`calendar:${tenantId}:*`)
}

export async function createCalendarBlock(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const unitId = formData.get("unitId") as string
  const startDate = new Date(formData.get("startDate") as string)
  const endDate = new Date(formData.get("endDate") as string)
  const reason = (formData.get("reason") as string) || null

  if (!unitId || !startDate || !endDate) {
    return { error: "Campos obrigatorios nao preenchidos" }
  }

  // Verify unit belongs to tenant
  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      property: { tenantId: session.user.tenantId },
      deletedAt: null,
    },
  })

  if (!unit) {
    return { error: "Unidade nao encontrada" }
  }

  await prisma.calendarBlock.create({
    data: {
      unitId,
      startDate,
      endDate,
      reason,
    },
  })

  // Invalidar cache do calendário
  await invalidateCalendarCache(session.user.tenantId)

  revalidatePath("/calendar")
  return { success: true }
}

export async function deleteCalendarBlock(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const block = await prisma.calendarBlock.findFirst({
    where: { id },
    include: {
      unit: {
        include: {
          property: { select: { tenantId: true } },
        },
      },
    },
  })

  if (!block || block.unit.property.tenantId !== session.user.tenantId) {
    return { error: "Bloqueio nao encontrado" }
  }

  await prisma.calendarBlock.delete({ where: { id } })

  // Invalidar cache do calendário
  await invalidateCalendarCache(session.user.tenantId)

  revalidatePath("/calendar")
  return { success: true }
}

// Timeline types
export type TimelineUnit = {
  id: string
  name: string
  propertyId: string
  propertyName: string
}

export type TimelineEvent = {
  id: string
  unitId: string
  start: Date
  end: Date
  type: "reservation" | "block"
  guestName?: string
  status?: string
  reason?: string
}

export type TimelineData = {
  units: TimelineUnit[]
  events: TimelineEvent[]
}

export async function getCalendarTimelineData(
  startDate: Date,
  endDate: Date,
  filters?: { propertyId?: string; ownerId?: string }
): Promise<TimelineData> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  const startKey = startDate.toISOString().split('T')[0]
  const endKey = endDate.toISOString().split('T')[0]
  const cacheKey = `calendar:timeline:${tenantId}:${startKey}:${endKey}:${filters?.propertyId || 'all'}:${filters?.ownerId || 'all'}`

  return cache.getOrSet<TimelineData>(
    cacheKey,
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unitWhere: any = {
        deletedAt: null,
        status: "ACTIVE",
        property: {
          tenantId,
          deletedAt: null,
        },
      }

      if (filters?.propertyId) {
        unitWhere.propertyId = filters.propertyId
      }

      if (filters?.ownerId) {
        unitWhere.OR = [
          { ownerId: filters.ownerId },
          { ownerId: null, property: { ownerId: filters.ownerId } },
        ]
      }

      // Buscar unidades ordenadas por property e nome
      const units = await prisma.unit.findMany({
        where: unitWhere,
        include: {
          property: { select: { id: true, name: true } },
        },
        orderBy: [
          { property: { name: "asc" } },
          { name: "asc" },
        ],
      })

      const unitIds = units.map(u => u.id)

      // Buscar reservas e bloqueios em paralelo
      const [reservations, blocks] = await Promise.all([
        prisma.reservation.findMany({
          where: {
            tenantId,
            unitId: { in: unitIds },
            OR: [
              { checkinDate: { gte: startDate, lte: endDate } },
              { checkoutDate: { gte: startDate, lte: endDate } },
              {
                AND: [
                  { checkinDate: { lte: startDate } },
                  { checkoutDate: { gte: endDate } },
                ],
              },
            ],
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
          },
          select: {
            id: true,
            unitId: true,
            checkinDate: true,
            checkoutDate: true,
            guestName: true,
            status: true,
          },
        }),
        prisma.calendarBlock.findMany({
          where: {
            unitId: { in: unitIds },
            OR: [
              { startDate: { gte: startDate, lte: endDate } },
              { endDate: { gte: startDate, lte: endDate } },
              {
                AND: [
                  { startDate: { lte: startDate } },
                  { endDate: { gte: endDate } },
                ],
              },
            ],
          },
          select: {
            id: true,
            unitId: true,
            startDate: true,
            endDate: true,
            reason: true,
          },
        }),
      ])

      const events: TimelineEvent[] = [
        ...reservations.map((r) => ({
          id: r.id,
          unitId: r.unitId,
          start: r.checkinDate,
          end: r.checkoutDate,
          type: "reservation" as const,
          guestName: r.guestName,
          status: r.status,
        })),
        ...blocks.map((b) => ({
          id: b.id,
          unitId: b.unitId,
          start: b.startDate,
          end: b.endDate,
          type: "block" as const,
          reason: b.reason || undefined,
        })),
      ]

      const result = {
        units: units.map(u => ({
          id: u.id,
          name: u.name,
          propertyId: u.property.id,
          propertyName: u.property.name,
        })),
        events,
      }

      return JSON.parse(JSON.stringify(result))
    },
    TTL.SHORT
  )
}
