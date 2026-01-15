"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { PricingRuleType } from "@prisma/client"

export type PricingRuleData = {
  id: string
  unitId: string
  name: string
  type: PricingRuleType
  priority: number
  basePrice: number
  minNights: number
  startDate: Date | null
  endDate: Date | null
  daysOfWeek: number[]
  active: boolean
}

// Obter regras de precificacao de uma unidade
export async function getPricingRules(unitId: string): Promise<PricingRuleData[]> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId

  // Verificar se a unidade pertence ao tenant
  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      property: { tenantId },
      deletedAt: null,
    },
  })

  if (!unit) {
    throw new Error("Unidade nao encontrada")
  }

  const rules = await prisma.pricingRule.findMany({
    where: { unitId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  })

  return rules.map((r) => ({
    id: r.id,
    unitId: r.unitId,
    name: r.name,
    type: r.type,
    priority: r.priority,
    basePrice: Number(r.basePrice),
    minNights: r.minNights,
    startDate: r.startDate,
    endDate: r.endDate,
    daysOfWeek: r.daysOfWeek,
    active: r.active,
  }))
}

// Criar regra de precificacao
export async function createPricingRule(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId

  const unitId = formData.get("unitId") as string
  const name = formData.get("name") as string
  const type = formData.get("type") as PricingRuleType
  const basePrice = parseFloat(formData.get("basePrice") as string)
  const priority = parseInt(formData.get("priority") as string) || 0
  const minNights = parseInt(formData.get("minNights") as string) || 1
  const startDateStr = formData.get("startDate") as string
  const endDateStr = formData.get("endDate") as string
  const daysOfWeekStr = formData.get("daysOfWeek") as string

  if (!unitId || !name || !type || isNaN(basePrice)) {
    return { error: "Campos obrigatorios nao preenchidos" }
  }

  // Verificar se a unidade pertence ao tenant
  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      property: { tenantId },
      deletedAt: null,
    },
  })

  if (!unit) {
    return { error: "Unidade nao encontrada" }
  }

  // Validacoes por tipo
  if (type === "SEASONAL" || type === "SPECIAL") {
    if (!startDateStr || !endDateStr) {
      return { error: "Data inicial e final sao obrigatorias para regras de temporada" }
    }
  }

  if (type === "DAY_OF_WEEK") {
    if (!daysOfWeekStr) {
      return { error: "Selecione pelo menos um dia da semana" }
    }
  }

  const startDate = startDateStr ? new Date(startDateStr) : null
  const endDate = endDateStr ? new Date(endDateStr) : null
  const daysOfWeek = daysOfWeekStr ? daysOfWeekStr.split(",").map(Number) : []

  await prisma.pricingRule.create({
    data: {
      unitId,
      name,
      type,
      basePrice,
      priority,
      minNights,
      startDate,
      endDate,
      daysOfWeek,
    },
  })

  revalidatePath(`/units/${unitId}`)
  revalidatePath(`/units/${unitId}/pricing`)
  return { success: true }
}

// Atualizar regra de precificacao
export async function updatePricingRule(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId

  // Verificar se a regra pertence ao tenant
  const rule = await prisma.pricingRule.findFirst({
    where: { id },
    include: {
      unit: {
        include: {
          property: { select: { tenantId: true } },
        },
      },
    },
  })

  if (!rule || rule.unit.property.tenantId !== tenantId) {
    return { error: "Regra nao encontrada" }
  }

  const name = formData.get("name") as string
  const basePrice = parseFloat(formData.get("basePrice") as string)
  const priority = parseInt(formData.get("priority") as string) || 0
  const minNights = parseInt(formData.get("minNights") as string) || 1
  const startDateStr = formData.get("startDate") as string
  const endDateStr = formData.get("endDate") as string
  const daysOfWeekStr = formData.get("daysOfWeek") as string
  const active = formData.get("active") === "true"

  const startDate = startDateStr ? new Date(startDateStr) : null
  const endDate = endDateStr ? new Date(endDateStr) : null
  const daysOfWeek = daysOfWeekStr ? daysOfWeekStr.split(",").map(Number) : []

  await prisma.pricingRule.update({
    where: { id },
    data: {
      name,
      basePrice,
      priority,
      minNights,
      startDate,
      endDate,
      daysOfWeek,
      active,
    },
  })

  revalidatePath(`/units/${rule.unitId}`)
  revalidatePath(`/units/${rule.unitId}/pricing`)
  return { success: true }
}

// Deletar regra de precificacao
export async function deletePricingRule(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId

  // Verificar se a regra pertence ao tenant
  const rule = await prisma.pricingRule.findFirst({
    where: { id },
    include: {
      unit: {
        include: {
          property: { select: { tenantId: true } },
        },
      },
    },
  })

  if (!rule || rule.unit.property.tenantId !== tenantId) {
    return { error: "Regra nao encontrada" }
  }

  await prisma.pricingRule.delete({ where: { id } })

  revalidatePath(`/units/${rule.unitId}`)
  revalidatePath(`/units/${rule.unitId}/pricing`)
  return { success: true }
}

// Toggle ativo/inativo
export async function togglePricingRule(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId

  // Verificar se a regra pertence ao tenant
  const rule = await prisma.pricingRule.findFirst({
    where: { id },
    include: {
      unit: {
        include: {
          property: { select: { tenantId: true } },
        },
      },
    },
  })

  if (!rule || rule.unit.property.tenantId !== tenantId) {
    return { error: "Regra nao encontrada" }
  }

  await prisma.pricingRule.update({
    where: { id },
    data: { active: !rule.active },
  })

  revalidatePath(`/units/${rule.unitId}`)
  revalidatePath(`/units/${rule.unitId}/pricing`)
  return { success: true }
}

// Calcular preco para um periodo especifico
export async function calculatePrice(unitId: string, checkinDate: Date, checkoutDate: Date): Promise<{
  totalPrice: number
  nightlyBreakdown: { date: Date; price: number; ruleName: string }[]
  nights: number
  averagePerNight: number
}> {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId

  // Verificar se a unidade pertence ao tenant
  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      property: { tenantId },
      deletedAt: null,
    },
  })

  if (!unit) {
    throw new Error("Unidade nao encontrada")
  }

  // Buscar todas as regras ativas da unidade
  const rules = await prisma.pricingRule.findMany({
    where: {
      unitId,
      active: true,
    },
    orderBy: { priority: "desc" },
  })

  // Calcular preco para cada noite
  const nightlyBreakdown: { date: Date; price: number; ruleName: string }[] = []
  let totalPrice = 0

  const currentDate = new Date(checkinDate)
  while (currentDate < checkoutDate) {
    const dayOfWeek = currentDate.getDay()
    let appliedRule: typeof rules[0] | null = null
    let priceForNight = 0

    // Encontrar a regra com maior prioridade que se aplica a esta data
    for (const rule of rules) {
      let applies = false

      switch (rule.type) {
        case "BASE":
          applies = true
          break
        case "SEASONAL":
        case "SPECIAL":
          if (rule.startDate && rule.endDate) {
            applies = currentDate >= rule.startDate && currentDate <= rule.endDate
          }
          break
        case "DAY_OF_WEEK":
          applies = rule.daysOfWeek.includes(dayOfWeek)
          break
      }

      if (applies) {
        appliedRule = rule
        priceForNight = Number(rule.basePrice)
        break // Ja encontrou a regra de maior prioridade
      }
    }

    // Se nenhuma regra foi encontrada, usar preco 0 (idealmente deve ter uma regra BASE)
    nightlyBreakdown.push({
      date: new Date(currentDate),
      price: priceForNight,
      ruleName: appliedRule?.name || "Sem regra",
    })

    totalPrice += priceForNight

    // Avancar para o proximo dia
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const nights = nightlyBreakdown.length

  return {
    totalPrice,
    nightlyBreakdown,
    nights,
    averagePerNight: nights > 0 ? totalPrice / nights : 0,
  }
}

// Obter unidades com suas regras de preco base (para listagem)
export async function getUnitsWithPricing() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tenantId = session.user.tenantId

  const units = await prisma.unit.findMany({
    where: {
      property: { tenantId },
      deletedAt: null,
      status: "ACTIVE",
    },
    include: {
      property: { select: { id: true, name: true } },
      pricingRules: {
        where: { active: true },
        orderBy: { priority: "desc" },
        take: 1,
      },
    },
    orderBy: [
      { property: { name: "asc" } },
      { name: "asc" },
    ],
  })

  return units.map((u) => ({
    id: u.id,
    name: u.name,
    propertyId: u.property.id,
    propertyName: u.property.name,
    hasBasePrice: u.pricingRules.length > 0,
    basePrice: u.pricingRules[0] ? Number(u.pricingRules[0].basePrice) : null,
  }))
}
