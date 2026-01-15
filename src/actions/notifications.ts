"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { cache, TTL } from "@/lib/redis"
import { startOfDay, endOfDay, addDays } from "date-fns"

export interface Notification {
  id: string
  type: "checkin" | "checkout" | "task" | "payout"
  title: string
  description: string
  href: string
  priority: "high" | "medium" | "low"
  date: Date
}

export async function getNotifications(): Promise<Notification[]> {
  const session = await auth()
  if (!session?.user?.tenantId) return []

  const tenantId = session.user.tenantId

  return cache.getOrSet<Notification[]>(
    `notifications:${tenantId}`,
    async () => {
      const today = startOfDay(new Date())
      const tomorrow = endOfDay(addDays(today, 1))
      const notifications: Notification[] = []

      // Executar todas as queries em paralelo para melhor performance
      const [
        todayCheckins,
        todayCheckouts,
        tomorrowCheckins,
        overdueTasks,
        todayTasks,
        pendingPayouts,
      ] = await Promise.all([
        // Check-ins de hoje
        prisma.reservation.findMany({
          where: {
            tenantId,
            status: "CONFIRMED",
            checkinDate: {
              gte: today,
              lte: endOfDay(today),
            },
          },
          include: {
            unit: {
              include: {
                property: { select: { name: true } },
              },
            },
          },
          orderBy: {
            checkinDate: "asc",
          },
        }),
        // Check-outs de hoje
        prisma.reservation.findMany({
          where: {
            tenantId,
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
            checkoutDate: {
              gte: today,
              lte: endOfDay(today),
            },
          },
          include: {
            unit: {
              include: {
                property: { select: { name: true } },
              },
            },
          },
          orderBy: {
            checkoutDate: "asc",
          },
        }),
        // Check-ins de amanhã
        prisma.reservation.findMany({
          where: {
            tenantId,
            status: "CONFIRMED",
            checkinDate: {
              gte: addDays(today, 1),
              lte: tomorrow,
            },
          },
          include: {
            unit: {
              include: {
                property: { select: { name: true } },
              },
            },
          },
          orderBy: {
            checkinDate: "asc",
          },
        }),
        // Tarefas atrasadas
        prisma.task.findMany({
          where: {
            tenantId,
            status: { in: ["PENDING", "IN_PROGRESS"] },
            scheduledDate: {
              lt: today,
            },
          },
          include: {
            unit: {
              include: {
                property: { select: { name: true } },
              },
            },
          },
          orderBy: {
            scheduledDate: "asc",
          },
          take: 10,
        }),
        // Tarefas de hoje
        prisma.task.findMany({
          where: {
            tenantId,
            status: { in: ["PENDING", "IN_PROGRESS"] },
            scheduledDate: {
              gte: today,
              lte: endOfDay(today),
            },
          },
          include: {
            unit: {
              include: {
                property: { select: { name: true } },
              },
            },
          },
          orderBy: {
            scheduledDate: "asc",
          },
        }),
        // Repasses pendentes
        prisma.ownerPayout.findMany({
          where: {
            owner: {
              tenantId,
            },
            status: "PENDING",
          },
          include: {
            owner: { select: { name: true } },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 5,
        }),
      ])

      // Processar check-ins de hoje
      for (const reservation of todayCheckins) {
        notifications.push({
          id: `checkin-${reservation.id}`,
          type: "checkin",
          title: "Check-in hoje",
          description: `${reservation.guestName} em ${reservation.unit.property.name} - ${reservation.unit.name}`,
          href: `/reservations/${reservation.id}`,
          priority: "high",
          date: reservation.checkinDate,
        })
      }

      // Processar check-outs de hoje
      for (const reservation of todayCheckouts) {
        notifications.push({
          id: `checkout-${reservation.id}`,
          type: "checkout",
          title: "Check-out hoje",
          description: `${reservation.guestName} em ${reservation.unit.property.name} - ${reservation.unit.name}`,
          href: `/reservations/${reservation.id}`,
          priority: "high",
          date: reservation.checkoutDate,
        })
      }

      // Processar check-ins de amanhã
      for (const reservation of tomorrowCheckins) {
        notifications.push({
          id: `checkin-tomorrow-${reservation.id}`,
          type: "checkin",
          title: "Check-in amanha",
          description: `${reservation.guestName} em ${reservation.unit.property.name} - ${reservation.unit.name}`,
          href: `/reservations/${reservation.id}`,
          priority: "medium",
          date: reservation.checkinDate,
        })
      }

      // Processar tarefas atrasadas
      for (const task of overdueTasks) {
        notifications.push({
          id: `task-overdue-${task.id}`,
          type: "task",
          title: "Tarefa atrasada",
          description: `${task.title} - ${task.unit.property.name} - ${task.unit.name}`,
          href: `/tasks/${task.id}`,
          priority: "high",
          date: task.scheduledDate,
        })
      }

      // Processar tarefas de hoje
      for (const task of todayTasks) {
        notifications.push({
          id: `task-today-${task.id}`,
          type: "task",
          title: "Tarefa para hoje",
          description: `${task.title} - ${task.unit.property.name} - ${task.unit.name}`,
          href: `/tasks/${task.id}`,
          priority: "medium",
          date: task.scheduledDate,
        })
      }

      // Processar repasses pendentes
      for (const payout of pendingPayouts) {
        notifications.push({
          id: `payout-${payout.id}`,
          type: "payout",
          title: "Repasse pendente",
          description: `${payout.owner.name} - R$ ${Number(payout.netAmount).toFixed(2)}`,
          href: `/financial/payouts/${payout.id}`,
          priority: "low",
          date: payout.createdAt,
        })
      }

      // Ordenar por prioridade e data
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      notifications.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

      return JSON.parse(JSON.stringify(notifications))
    },
    TTL.SHORT // 60 segundos - notificações mudam frequentemente
  )
}

export async function getNotificationCount(): Promise<number> {
  const notifications = await getNotifications()
  return notifications.filter(n => n.priority === "high").length
}

// Invalidar cache de notificações (chamar quando houver mudanças relevantes)
export async function invalidateNotificationsCache(tenantId: string): Promise<void> {
  await cache.del(`notifications:${tenantId}`)
}
