"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getTenant() {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return null
  }

  return prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  })
}

export async function updateTenantLogo(logoUrl: string | null) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return { error: "Nao autorizado" }
  }

  // Apenas admin pode alterar logo
  if (session.user.role !== "ADMIN") {
    return { error: "Apenas administradores podem alterar a logo" }
  }

  try {
    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: { logo: logoUrl },
    })

    revalidatePath("/settings")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar logo:", error)
    return { error: "Erro ao atualizar logo" }
  }
}

export async function updateTenant(data: { name?: string; logo?: string | null }) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return { error: "Nao autorizado" }
  }

  // Apenas admin pode alterar tenant
  if (session.user.role !== "ADMIN") {
    return { error: "Apenas administradores podem alterar configuracoes" }
  }

  try {
    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data,
    })

    revalidatePath("/settings")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar tenant:", error)
    return { error: "Erro ao atualizar configuracoes" }
  }
}
