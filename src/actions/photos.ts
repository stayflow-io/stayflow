"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { writeFile, unlink, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { cache, cacheKeys } from "@/lib/redis"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "units")

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function uploadUnitPhoto(unitId: string, formData: FormData) {
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

  // Verify unit belongs to tenant
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, property: { tenantId: session.user.tenantId } },
    include: { property: true },
  })

  if (!unit) {
    return { error: "Unidade nao encontrada" }
  }

  try {
    await ensureUploadDir()

    // Generate unique filename
    const ext = file.name.split(".").pop()
    const filename = `${unitId}-${Date.now()}.${ext}`
    const filepath = join(UPLOAD_DIR, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Get current max order
    const maxOrder = await prisma.unitPhoto.aggregate({
      where: { unitId },
      _max: { order: true },
    })

    const newOrder = (maxOrder._max.order || 0) + 1

    // Save to database
    const photo = await prisma.unitPhoto.create({
      data: {
        unitId,
        url: `/uploads/units/${filename}`,
        order: newOrder,
      },
    })

    // Invalidar cache da unidade e propriedade
    await Promise.all([
      cache.del(cacheKeys.unit(unitId)),
      cache.del(cacheKeys.property(unit.propertyId)),
    ])

    revalidatePath(`/properties/${unit.propertyId}`)
    revalidatePath(`/properties/${unit.propertyId}/units/${unitId}`)
    return { success: true, photo }
  } catch (error) {
    console.error("Error uploading photo:", error)
    return { error: "Erro ao fazer upload da foto" }
  }
}

export async function deleteUnitPhoto(photoId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const photo = await prisma.unitPhoto.findFirst({
    where: { id: photoId },
    include: { unit: { include: { property: true } } },
  })

  if (!photo || photo.unit.property.tenantId !== session.user.tenantId) {
    return { error: "Foto nao encontrada" }
  }

  try {
    // Delete file from disk
    const filepath = join(process.cwd(), "public", photo.url)
    if (existsSync(filepath)) {
      await unlink(filepath)
    }

    // Delete from database
    await prisma.unitPhoto.delete({
      where: { id: photoId },
    })

    // Invalidar cache da unidade e propriedade
    await Promise.all([
      cache.del(cacheKeys.unit(photo.unitId)),
      cache.del(cacheKeys.property(photo.unit.propertyId)),
    ])

    revalidatePath(`/properties/${photo.unit.propertyId}`)
    revalidatePath(`/properties/${photo.unit.propertyId}/units/${photo.unitId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting photo:", error)
    return { error: "Erro ao excluir foto" }
  }
}

export async function reorderUnitPhotos(unitId: string, photoIds: string[]) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // Verify unit belongs to tenant
  const unit = await prisma.unit.findFirst({
    where: { id: unitId, property: { tenantId: session.user.tenantId } },
    include: { property: true },
  })

  if (!unit) {
    return { error: "Unidade nao encontrada" }
  }

  try {
    // Update order for each photo
    await Promise.all(
      photoIds.map((photoId, index) =>
        prisma.unitPhoto.update({
          where: { id: photoId },
          data: { order: index + 1 },
        })
      )
    )

    // Invalidar cache da unidade e propriedade
    await Promise.all([
      cache.del(cacheKeys.unit(unitId)),
      cache.del(cacheKeys.property(unit.propertyId)),
    ])

    revalidatePath(`/properties/${unit.propertyId}`)
    revalidatePath(`/properties/${unit.propertyId}/units/${unitId}`)
    return { success: true }
  } catch (error) {
    console.error("Error reordering photos:", error)
    return { error: "Erro ao reordenar fotos" }
  }
}

export async function getUnitPhotos(unitId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.unitPhoto.findMany({
    where: { unitId },
    orderBy: { order: "asc" },
  })
}

// Legacy aliases for backwards compatibility during migration
export const uploadPropertyPhoto = uploadUnitPhoto
export const deletePropertyPhoto = deleteUnitPhoto
export const reorderPropertyPhotos = reorderUnitPhotos
export const getPropertyPhotos = getUnitPhotos
