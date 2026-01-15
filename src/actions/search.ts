"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export type SearchResult = {
  type: "property" | "reservation" | "owner" | "task"
  id: string
  title: string
  subtitle: string
  href: string
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  if (!query || query.length < 2) {
    return []
  }

  const tenantId = session.user.tenantId

  // Executar todas as buscas em paralelo para melhor performance
  const [properties, reservations, owners, tasks] = await Promise.all([
    // Buscar imóveis
    prisma.property.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
      },
    }),
    // Buscar reservas (por nome do hóspede ou email)
    prisma.reservation.findMany({
      where: {
        tenantId,
        OR: [
          { guestName: { contains: query, mode: "insensitive" } },
          { guestEmail: { contains: query, mode: "insensitive" } },
          { guestPhone: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: {
        id: true,
        guestName: true,
        property: { select: { name: true } },
      },
    }),
    // Buscar proprietários
    prisma.owner.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
    // Buscar tarefas
    prisma.task.findMany({
      where: {
        tenantId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 4,
      select: {
        id: true,
        title: true,
        property: { select: { name: true } },
      },
    }),
  ])

  const results: SearchResult[] = []

  // Processar resultados
  properties.forEach((p) => {
    results.push({
      type: "property",
      id: p.id,
      title: p.name,
      subtitle: `${p.city}, ${p.state}`,
      href: `/properties/${p.id}`,
    })
  })

  reservations.forEach((r) => {
    results.push({
      type: "reservation",
      id: r.id,
      title: r.guestName,
      subtitle: r.property.name,
      href: `/reservations/${r.id}`,
    })
  })

  owners.forEach((o) => {
    results.push({
      type: "owner",
      id: o.id,
      title: o.name,
      subtitle: o.email,
      href: `/owners/${o.id}`,
    })
  })

  tasks.forEach((t) => {
    results.push({
      type: "task",
      id: t.id,
      title: t.title,
      subtitle: t.property.name,
      href: `/tasks/${t.id}`,
    })
  })

  return results.slice(0, 10) // Limitar a 10 resultados totais
}
