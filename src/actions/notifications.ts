"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { startOfDay, endOfDay, addDays, isBefore } from "date-fns"

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

  const today = startOfDay(new Date())
  const tomorrow = endOfDay(addDays(today, 1))
  const notifications: Notification[] = []

  // Check-ins de hoje
  const todayCheckins = await prisma.reservation.findMany({
    where: {
      tenantId: session.user.tenantId,
      status: "CONFIRMED",
      checkinDate: {
        gte: today,
        lte: endOfDay(today),
      },
    },
    include: {
      property: true,
    },
    orderBy: {
      checkinDate: "asc",
    },
  })

  for (const reservation of todayCheckins) {
    notifications.push({
      id: `checkin-${reservation.id}`,
      type: "checkin",
      title: "Check-in hoje",
      description: `${reservation.guestName} em ${reservation.property.name}`,
      href: `/reservations/${reservation.id}`,
      priority: "high",
      date: reservation.checkinDate,
    })
  }

  // Check-outs de hoje
  const todayCheckouts = await prisma.reservation.findMany({
    where: {
      tenantId: session.user.tenantId,
      status: { in: ["CONFIRMED", "CHECKED_IN"] },
      checkoutDate: {
        gte: today,
        lte: endOfDay(today),
      },
    },
    include: {
      property: true,
    },
    orderBy: {
      checkoutDate: "asc",
    },
  })

  for (const reservation of todayCheckouts) {
    notifications.push({
      id: `checkout-${reservation.id}`,
      type: "checkout",
      title: "Check-out hoje",
      description: `${reservation.guestName} em ${reservation.property.name}`,
      href: `/reservations/${reservation.id}`,
      priority: "high",
      date: reservation.checkoutDate,
    })
  }

  // Check-ins de amanhã
  const tomorrowCheckins = await prisma.reservation.findMany({
    where: {
      tenantId: session.user.tenantId,
      status: "CONFIRMED",
      checkinDate: {
        gte: addDays(today, 1),
        lte: tomorrow,
      },
    },
    include: {
      property: true,
    },
    orderBy: {
      checkinDate: "asc",
    },
  })

  for (const reservation of tomorrowCheckins) {
    notifications.push({
      id: `checkin-tomorrow-${reservation.id}`,
      type: "checkin",
      title: "Check-in amanha",
      description: `${reservation.guestName} em ${reservation.property.name}`,
      href: `/reservations/${reservation.id}`,
      priority: "medium",
      date: reservation.checkinDate,
    })
  }

  // Tarefas atrasadas
  const overdueTasks = await prisma.task.findMany({
    where: {
      tenantId: session.user.tenantId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      scheduledDate: {
        lt: today,
      },
    },
    include: {
      property: true,
    },
    orderBy: {
      scheduledDate: "asc",
    },
  })

  for (const task of overdueTasks) {
    notifications.push({
      id: `task-overdue-${task.id}`,
      type: "task",
      title: "Tarefa atrasada",
      description: `${task.title} - ${task.property.name}`,
      href: `/tasks/${task.id}`,
      priority: "high",
      date: task.scheduledDate,
    })
  }

  // Tarefas de hoje
  const todayTasks = await prisma.task.findMany({
    where: {
      tenantId: session.user.tenantId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      scheduledDate: {
        gte: today,
        lte: endOfDay(today),
      },
    },
    include: {
      property: true,
    },
    orderBy: {
      scheduledDate: "asc",
    },
  })

  for (const task of todayTasks) {
    notifications.push({
      id: `task-today-${task.id}`,
      type: "task",
      title: "Tarefa para hoje",
      description: `${task.title} - ${task.property.name}`,
      href: `/tasks/${task.id}`,
      priority: "medium",
      date: task.scheduledDate,
    })
  }

  // Repasses pendentes
  const pendingPayouts = await prisma.ownerPayout.findMany({
    where: {
      owner: {
        tenantId: session.user.tenantId,
      },
      status: "PENDING",
    },
    include: {
      owner: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 5,
  })

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
    return a.date.getTime() - b.date.getTime()
  })

  return notifications
}

export async function getNotificationCount(): Promise<number> {
  const notifications = await getNotifications()
  return notifications.filter(n => n.priority === "high").length
}
