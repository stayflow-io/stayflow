"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { z } from "zod"

const userSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR"]),
})

export async function getUsers() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // Only admins can see all users
  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden")
  }

  return prisma.user.findMany({
    where: { tenantId: session.user.tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getUser(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden")
  }

  return prisma.user.findFirst({
    where: { id, tenantId: session.user.tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })
}

export async function createUser(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  if (session.user.role !== "ADMIN") {
    return { error: "Apenas administradores podem criar usuarios" }
  }

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  }

  const validated = userSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email: validated.data.email },
  })

  if (existing) {
    return { error: "Este email ja esta em uso" }
  }

  const hashedPassword = await bcrypt.hash(validated.data.password!, 10)

  const user = await prisma.user.create({
    data: {
      name: validated.data.name,
      email: validated.data.email,
      passwordHash: hashedPassword,
      role: validated.data.role,
      tenantId: session.user.tenantId,
    },
  })

  revalidatePath("/settings/users")
  return { success: true, id: user.id }
}

export async function updateUser(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  if (session.user.role !== "ADMIN") {
    return { error: "Apenas administradores podem editar usuarios" }
  }

  const rawData: any = {
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  }

  const password = formData.get("password") as string
  if (password) {
    rawData.password = password
  }

  const validated = userSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  // Check if email already exists (for other users)
  const existing = await prisma.user.findFirst({
    where: {
      email: validated.data.email,
      id: { not: id },
    },
  })

  if (existing) {
    return { error: "Este email ja esta em uso" }
  }

  const updateData: any = {
    name: validated.data.name,
    email: validated.data.email,
    role: validated.data.role,
  }

  if (password) {
    updateData.password = await bcrypt.hash(password, 10)
  }

  await prisma.user.update({
    where: { id, tenantId: session.user.tenantId },
    data: updateData,
  })

  revalidatePath("/settings/users")
  return { success: true }
}

export async function deleteUser(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  if (session.user.role !== "ADMIN") {
    return { error: "Apenas administradores podem excluir usuarios" }
  }

  // Prevent deleting yourself
  if (id === session.user.id) {
    return { error: "Voce nao pode excluir sua propria conta" }
  }

  await prisma.user.delete({
    where: { id, tenantId: session.user.tenantId },
  })

  revalidatePath("/settings/users")
  return { success: true }
}
