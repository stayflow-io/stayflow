import { PrismaClient } from "@prisma/client"
import { put } from "@vercel/blob"
import { config } from "dotenv"

// Load environment variables
config({ path: ".env.development" })
config({ path: ".env" })

const prisma = new PrismaClient()

// Imagens de alta qualidade do Unsplash para propriedades de praia
const beachPropertyImages = [
  "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
  "https://images.unsplash.com/photo-1586611292717-f828b167408c?w=800&q=80",
]

const apartmentImages = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
  "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80",
  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
]

const bedroomImages = [
  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
  "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=800&q=80",
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
  "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80",
]

const bathroomImages = [
  "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
  "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&q=80",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80",
]

const balconyViewImages = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
]

const logoImage = "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=80"

// Cache de URLs já baixadas para evitar duplicatas
const uploadedUrls: Map<string, string> = new Map()

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function downloadAndUpload(sourceUrl: string, folder: string): Promise<string> {
  // Check cache first
  const cacheKey = `${folder}:${sourceUrl}`
  if (uploadedUrls.has(cacheKey)) {
    return uploadedUrls.get(cacheKey)!
  }

  try {
    // Download image
    const response = await fetch(sourceUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sourceUrl}`)
    }

    const blob = await response.blob()
    const buffer = Buffer.from(await blob.arrayBuffer())

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const filename = `${folder}/${timestamp}-${randomStr}.jpg`

    // Upload to Vercel Blob
    const result = await put(filename, buffer, {
      access: "public",
      contentType: "image/jpeg",
    })

    // Cache the result
    uploadedUrls.set(cacheKey, result.url)

    return result.url
  } catch (error) {
    console.error(`Erro ao processar ${sourceUrl}:`, error)
    // Return original URL as fallback
    return sourceUrl
  }
}

async function main() {
  // Check if BLOB_READ_WRITE_TOKEN is set
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("❌ BLOB_READ_WRITE_TOKEN nao configurado!")
    console.error("   Configure a variavel de ambiente e tente novamente.")
    console.error("   Voce pode obter o token em: https://vercel.com/dashboard/stores")
    process.exit(1)
  }

  console.log("🖼️  Adicionando imagens para unidades AFT (upload para Vercel Blob)...")
  console.log("")

  // Get AFT tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "aft" },
  })

  if (!tenant) {
    console.log("❌ Tenant AFT nao encontrado. Execute db:seed:aft primeiro.")
    return
  }

  // Get all units from AFT tenant that don't have photos
  const units = await prisma.unit.findMany({
    where: {
      property: { tenantId: tenant.id },
      deletedAt: null,
      photos: { none: {} },
    },
    include: {
      property: true,
    },
    take: 100, // Process in batches to avoid timeout
  })

  console.log(`📦 Encontradas ${units.length} unidades sem fotos`)

  if (units.length === 0) {
    console.log("✅ Todas as unidades ja possuem fotos!")

    // Just update logo if needed
    if (!tenant.logo) {
      console.log("🏢 Atualizando logo do tenant...")
      const logoUrl = await downloadAndUpload(logoImage, "logos")
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { logo: logoUrl },
      })
      console.log("✅ Logo atualizada!")
    }
    return
  }

  let photosAdded = 0

  for (let i = 0; i < units.length; i++) {
    const unit = units[i]

    console.log(`   [${i + 1}/${units.length}] ${unit.name} (${unit.property.name})`)

    // Generate 2-3 photos per unit (less to avoid rate limits)
    const numPhotos = randomInt(2, 3)
    const photos: { unitId: string; url: string; order: number }[] = []

    // First photo - main view
    const mainUrl = await downloadAndUpload(randomItem(apartmentImages), `units/${unit.id}`)
    photos.push({ unitId: unit.id, url: mainUrl, order: 0 })

    // Second photo - bedroom
    const bedroomUrl = await downloadAndUpload(randomItem(bedroomImages), `units/${unit.id}`)
    photos.push({ unitId: unit.id, url: bedroomUrl, order: 1 })

    // Third photo if needed
    if (numPhotos >= 3) {
      const thirdUrl = await downloadAndUpload(
        Math.random() > 0.5 ? randomItem(bathroomImages) : randomItem(balconyViewImages),
        `units/${unit.id}`
      )
      photos.push({ unitId: unit.id, url: thirdUrl, order: 2 })
    }

    // Insert photos
    await prisma.unitPhoto.createMany({
      data: photos,
    })

    photosAdded += photos.length

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  // Update tenant logo
  if (!tenant.logo) {
    console.log("")
    console.log("🏢 Atualizando logo do tenant...")
    const logoUrl = await downloadAndUpload(logoImage, "logos")
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { logo: logoUrl },
    })
  }

  const finalCount = await prisma.unitPhoto.count({
    where: {
      unit: {
        property: { tenantId: tenant.id },
      },
    },
  })

  const remainingUnits = await prisma.unit.count({
    where: {
      property: { tenantId: tenant.id },
      deletedAt: null,
      photos: { none: {} },
    },
  })

  console.log("")
  console.log("=" .repeat(50))
  console.log("✅ PROCESSAMENTO CONCLUIDO!")
  console.log("=" .repeat(50))
  console.log("")
  console.log(`📸 Fotos adicionadas nesta execucao: ${photosAdded}`)
  console.log(`📸 Total de fotos no sistema: ${finalCount}`)
  if (remainingUnits > 0) {
    console.log(`⏳ Unidades restantes sem fotos: ${remainingUnits}`)
    console.log(`   Execute novamente para continuar o upload.`)
  } else {
    console.log(`✅ Todas as unidades possuem fotos!`)
  }
  console.log("")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
