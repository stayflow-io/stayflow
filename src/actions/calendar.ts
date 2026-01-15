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
  propertyId: string
  propertyName: string
  guestName?: string
  channel?: string
}

type CalendarEventsResult = {
  reservations: CalendarEvent[]
  blocks: CalendarEvent[]
}

export async function getCalendarEvents(startDate: Date, endDate: Date, propertyId?: string): Promise<CalendarEventsResult> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId
  // Criar chave de cache com base nos parâmetros
  const startKey = startDate.toISOString().split('T')[0]
  const endKey = endDate.toISOString().split('T')[0]
  const cacheKey = `calendar:${tenantId}:${startKey}:${endKey}:${propertyId || 'all'}`

  return cache.getOrSet<CalendarEventsResult>(
    cacheKey,
    async () => {
      const [reservations, blocks] = await Promise.all([
        prisma.reservation.findMany({
          where: {
            tenantId,
            ...(propertyId && { propertyId }),
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
            property: { select: { name: true } },
            channel: { select: { name: true } },
          },
        }),
        prisma.calendarBlock.findMany({
          where: {
            property: {
              tenantId,
              ...(propertyId && { id: propertyId }),
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
            property: { select: { name: true } },
          },
        }),
      ])

      const result = {
        reservations: reservations.map((r) => ({
          id: r.id,
          title: `${r.guestName} - ${r.property.name}`,
          start: r.checkinDate,
          end: r.checkoutDate,
          type: "reservation" as const,
          status: r.status,
          propertyId: r.propertyId,
          propertyName: r.property.name,
          guestName: r.guestName,
          channel: r.channel?.name,
        })),
        blocks: blocks.map((b) => ({
          id: b.id,
          title: b.reason || "Bloqueado",
          start: b.startDate,
          end: b.endDate,
          type: "block" as const,
          propertyId: b.propertyId,
          propertyName: b.property.name,
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

  const propertyId = formData.get("propertyId") as string
  const startDate = new Date(formData.get("startDate") as string)
  const endDate = new Date(formData.get("endDate") as string)
  const reason = (formData.get("reason") as string) || null

  if (!propertyId || !startDate || !endDate) {
    return { error: "Campos obrigatorios nao preenchidos" }
  }

  const property = await prisma.property.findFirst({
    where: { id: propertyId, tenantId: session.user.tenantId },
  })

  if (!property) {
    return { error: "Imovel nao encontrado" }
  }

  await prisma.calendarBlock.create({
    data: {
      propertyId,
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
    include: { property: true },
  })

  if (!block || block.property.tenantId !== session.user.tenantId) {
    return { error: "Bloqueio nao encontrado" }
  }

  await prisma.calendarBlock.delete({ where: { id } })

  // Invalidar cache do calendário
  await invalidateCalendarCache(session.user.tenantId)

  revalidatePath("/calendar")
  return { success: true }
}
