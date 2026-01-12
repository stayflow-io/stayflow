"use server"

import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations/auth"

export async function registerUser(formData: FormData) {
  const rawData = {
    companyName: formData.get("companyName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const validated = registerSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const { companyName, name, email, password } = validated.data

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return { error: "Email ja cadastrado" }
  }

  // Create tenant and user
  const slug = companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  // Ensure unique slug
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug },
  })

  const finalSlug = existingTenant
    ? `${slug}-${Date.now()}`
    : slug

  const passwordHash = await hash(password, 12)

  await prisma.tenant.create({
    data: {
      name: companyName,
      slug: finalSlug,
      users: {
        create: {
          name,
          email,
          passwordHash,
          role: "ADMIN",
        },
      },
    },
  })

  return { success: true }
}
