/**
 * Migration script: Create Units from existing Properties
 *
 * This script:
 * 1. Creates a Unit for each existing Property
 * 2. Updates Reservations, Tasks, Transactions, CalendarBlocks to use unitId
 * 3. Migrates PropertyPhotos to UnitPhotos
 *
 * Run with: npx tsx scripts/migrate-to-units.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration to Units...')

  // Get all properties that don't have units yet
  const properties = await prisma.property.findMany({
    include: {
      units: true,
    },
  })

  console.log(`Found ${properties.length} properties`)

  for (const property of properties) {
    // Skip if property already has units
    if (property.units.length > 0) {
      console.log(`Property ${property.name} already has ${property.units.length} units, skipping...`)
      continue
    }

    console.log(`Creating unit for property: ${property.name}`)

    // Create a unit for this property
    // Note: We need to handle the case where the schema has changed
    // The property may still have old fields (bedrooms, etc) or they may have been removed
    const unit = await prisma.unit.create({
      data: {
        propertyId: property.id,
        ownerId: null, // Will inherit from property
        name: property.name,
        bedrooms: (property as any).bedrooms || 1,
        bathrooms: (property as any).bathrooms || 1,
        maxGuests: (property as any).maxGuests || 2,
        description: property.description,
        amenities: property.amenities,
        cleaningFee: (property as any).cleaningFee || 0,
        adminFeePercent: (property as any).adminFeePercent || 20,
        status: 'ACTIVE',
      },
    })

    console.log(`Created unit ${unit.id} for property ${property.id}`)

    // Update reservations to use the new unit
    const updatedReservations = await prisma.reservation.updateMany({
      where: {
        // @ts-ignore - propertyId may or may not exist depending on schema state
        propertyId: property.id,
      },
      data: {
        unitId: unit.id,
      },
    })
    console.log(`Updated ${updatedReservations.count} reservations`)

    // Update tasks
    const updatedTasks = await prisma.task.updateMany({
      where: {
        // @ts-ignore
        propertyId: property.id,
      },
      data: {
        unitId: unit.id,
      },
    })
    console.log(`Updated ${updatedTasks.count} tasks`)

    // Update transactions
    const updatedTransactions = await prisma.transaction.updateMany({
      where: {
        // @ts-ignore
        propertyId: property.id,
      },
      data: {
        unitId: unit.id,
      },
    })
    console.log(`Updated ${updatedTransactions.count} transactions`)

    // Update calendar blocks
    const updatedCalendarBlocks = await prisma.calendarBlock.updateMany({
      where: {
        // @ts-ignore
        propertyId: property.id,
      },
      data: {
        unitId: unit.id,
      },
    })
    console.log(`Updated ${updatedCalendarBlocks.count} calendar blocks`)

    // Migrate photos - need to check if PropertyPhoto still exists
    try {
      // @ts-ignore
      const photos = await prisma.propertyPhoto?.findMany({
        where: { propertyId: property.id },
      })

      if (photos && photos.length > 0) {
        for (const photo of photos) {
          await prisma.unitPhoto.create({
            data: {
              unitId: unit.id,
              url: photo.url,
              order: photo.order,
            },
          })
        }
        console.log(`Migrated ${photos.length} photos`)
      }
    } catch (e) {
      // PropertyPhoto table may not exist anymore
      console.log('PropertyPhoto table not found, skipping photo migration')
    }
  }

  console.log('Migration completed!')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
