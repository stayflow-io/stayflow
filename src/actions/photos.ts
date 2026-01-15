"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { writeFile, unlink, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { cache, cacheKeys } from "@/lib/redis"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "properties")

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function uploadPropertyPhoto(propertyId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const file = formData.get("file") as File
  if (!file) {
    return { error: "Nenhum arquivo enviado" }
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return { error: "Tipo de arquivo nao permitido. Use JPEG, PNG ou WebP." }
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Arquivo muito grande. Maximo 5MB." }
  }

  // Verify property belongs to tenant
  const property = await prisma.property.findFirst({
    where: { id: propertyId, tenantId: session.user.tenantId },
  })

  if (!property) {
    return { error: "Imovel nao encontrado" }
  }

  try {
    await ensureUploadDir()

    // Generate unique filename
    const ext = file.name.split(".").pop()
    const filename = `${propertyId}-${Date.now()}.${ext}`
    const filepath = join(UPLOAD_DIR, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Get current max order
    const maxOrder = await prisma.propertyPhoto.aggregate({
      where: { propertyId },
      _max: { order: true },
    })

    const newOrder = (maxOrder._max.order || 0) + 1

    // Save to database
    const photo = await prisma.propertyPhoto.create({
      data: {
        propertyId,
        url: `/uploads/properties/${filename}`,
        order: newOrder,
      },
    })

    // Invalidar cache do imóvel
    await cache.del(cacheKeys.property(propertyId))

    revalidatePath(`/properties/${propertyId}`)
    return { success: true, photo }
  } catch (error) {
    console.error("Error uploading photo:", error)
    return { error: "Erro ao fazer upload da foto" }
  }
}

export async function deletePropertyPhoto(photoId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const photo = await prisma.propertyPhoto.findFirst({
    where: { id: photoId },
    include: { property: true },
  })

  if (!photo || photo.property.tenantId !== session.user.tenantId) {
    return { error: "Foto nao encontrada" }
  }

  try {
    // Delete file from disk
    const filepath = join(process.cwd(), "public", photo.url)
    if (existsSync(filepath)) {
      await unlink(filepath)
    }

    // Delete from database
    await prisma.propertyPhoto.delete({
      where: { id: photoId },
    })

    // Invalidar cache do imóvel
    await cache.del(cacheKeys.property(photo.propertyId))

    revalidatePath(`/properties/${photo.propertyId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting photo:", error)
    return { error: "Erro ao excluir foto" }
  }
}

export async function reorderPropertyPhotos(propertyId: string, photoIds: string[]) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // Verify property belongs to tenant
  const property = await prisma.property.findFirst({
    where: { id: propertyId, tenantId: session.user.tenantId },
  })

  if (!property) {
    return { error: "Imovel nao encontrado" }
  }

  try {
    // Update order for each photo
    await Promise.all(
      photoIds.map((photoId, index) =>
        prisma.propertyPhoto.update({
          where: { id: photoId },
          data: { order: index + 1 },
        })
      )
    )

    // Invalidar cache do imóvel
    await cache.del(cacheKeys.property(propertyId))

    revalidatePath(`/properties/${propertyId}`)
    return { success: true }
  } catch (error) {
    console.error("Error reordering photos:", error)
    return { error: "Erro ao reordenar fotos" }
  }
}

export async function getPropertyPhotos(propertyId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.propertyPhoto.findMany({
    where: { propertyId },
    orderBy: { order: "asc" },
  })
}
