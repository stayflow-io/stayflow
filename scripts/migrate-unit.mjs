import pg from "pg"

const { Client } = pg

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  await client.connect()
  console.log("Connected to database")

  try {
    // Check if Unit table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'Unit'
      );
    `)

    if (tableCheck.rows[0].exists) {
      console.log("Unit table already exists. Checking if migration is complete...")

      // Check if unitId exists in Reservation
      const colCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = 'Reservation'
          AND column_name = 'unitId'
        );
      `)

      if (colCheck.rows[0].exists) {
        console.log("Migration already complete. Skipping.")
        return
      }
    }

    // Check if we have the old schema (propertyId in Reservation)
    const oldSchemaCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Reservation'
        AND column_name = 'propertyId'
      );
    `)

    if (!oldSchemaCheck.rows[0].exists) {
      console.log("Neither old nor new schema found. Fresh database - skipping migration.")
      return
    }

    console.log("Old schema detected. Running migration...")

    // Run the full migration
    await client.query(`
      -- 1. Create UnitStatus enum if not exists
      DO $$ BEGIN
        CREATE TYPE "UnitStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- 2. Create Unit table if not exists
      CREATE TABLE IF NOT EXISTS "Unit" (
        "id" TEXT NOT NULL,
        "propertyId" TEXT NOT NULL,
        "ownerId" TEXT,
        "name" TEXT NOT NULL,
        "bedrooms" INTEGER NOT NULL DEFAULT 1,
        "bathrooms" INTEGER NOT NULL DEFAULT 1,
        "maxGuests" INTEGER NOT NULL DEFAULT 4,
        "description" TEXT,
        "amenities" TEXT[] DEFAULT '{}',
        "cleaningFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
        "adminFeePercent" DECIMAL(65,30) NOT NULL DEFAULT 20,
        "status" "UnitStatus" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deletedAt" TIMESTAMP(3),
        CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
      );
    `)
    console.log("Created Unit table")

    // Create UnitPhoto table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "UnitPhoto" (
        "id" TEXT NOT NULL,
        "unitId" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UnitPhoto_pkey" PRIMARY KEY ("id")
      );
    `)
    console.log("Created UnitPhoto table")

    // Add indexes and foreign keys
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Unit_propertyId_idx" ON "Unit"("propertyId");
      CREATE INDEX IF NOT EXISTS "Unit_ownerId_idx" ON "Unit"("ownerId");
      CREATE INDEX IF NOT EXISTS "Unit_propertyId_status_idx" ON "Unit"("propertyId", "status");

      DO $$ BEGIN
        ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey"
          FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        ALTER TABLE "Unit" ADD CONSTRAINT "Unit_ownerId_fkey"
          FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        ALTER TABLE "UnitPhoto" ADD CONSTRAINT "UnitPhoto_unitId_fkey"
          FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    console.log("Added indexes and foreign keys")

    // Create Unit for each existing Property
    const result = await client.query(`
      INSERT INTO "Unit" ("id", "propertyId", "ownerId", "name", "bedrooms", "bathrooms", "maxGuests", "description", "amenities", "cleaningFee", "adminFeePercent", "status", "createdAt", "updatedAt", "deletedAt")
      SELECT
        gen_random_uuid()::text,
        "id",
        NULL,
        "name",
        COALESCE("bedrooms", 1),
        COALESCE("bathrooms", 1),
        COALESCE("maxGuests", 4),
        "description",
        "amenities",
        COALESCE("cleaningFee", 0),
        COALESCE("adminFeePercent", 20),
        CASE "status"
          WHEN 'ACTIVE' THEN 'ACTIVE'::"UnitStatus"
          WHEN 'INACTIVE' THEN 'INACTIVE'::"UnitStatus"
          WHEN 'MAINTENANCE' THEN 'MAINTENANCE'::"UnitStatus"
          ELSE 'ACTIVE'::"UnitStatus"
        END,
        "createdAt",
        "updatedAt",
        "deletedAt"
      FROM "Property"
      WHERE NOT EXISTS (SELECT 1 FROM "Unit" WHERE "Unit"."propertyId" = "Property"."id")
      RETURNING id;
    `)
    console.log(`Created ${result.rowCount} units from properties`)

    // Add unitId columns
    await client.query(`
      ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "unitId" TEXT;
      ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "unitId" TEXT;
      ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "unitId" TEXT;
      ALTER TABLE "CalendarBlock" ADD COLUMN IF NOT EXISTS "unitId" TEXT;
    `)
    console.log("Added unitId columns")

    // Populate unitId
    await client.query(`
      UPDATE "Reservation" r SET "unitId" = u."id"
      FROM "Unit" u WHERE u."propertyId" = r."propertyId" AND r."unitId" IS NULL;

      UPDATE "Task" t SET "unitId" = u."id"
      FROM "Unit" u WHERE u."propertyId" = t."propertyId" AND t."unitId" IS NULL;

      UPDATE "Transaction" t SET "unitId" = u."id"
      FROM "Unit" u WHERE u."propertyId" = t."propertyId" AND t."unitId" IS NULL;

      UPDATE "CalendarBlock" cb SET "unitId" = u."id"
      FROM "Unit" u WHERE u."propertyId" = cb."propertyId" AND cb."unitId" IS NULL;
    `)
    console.log("Populated unitId columns")

    // Make unitId NOT NULL and add foreign keys
    await client.query(`
      ALTER TABLE "Reservation" ALTER COLUMN "unitId" SET NOT NULL;
      ALTER TABLE "Task" ALTER COLUMN "unitId" SET NOT NULL;
      ALTER TABLE "Transaction" ALTER COLUMN "unitId" SET NOT NULL;
      ALTER TABLE "CalendarBlock" ALTER COLUMN "unitId" SET NOT NULL;

      DO $$ BEGIN
        ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_unitId_fkey"
          FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        ALTER TABLE "Task" ADD CONSTRAINT "Task_unitId_fkey"
          FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_unitId_fkey"
          FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        ALTER TABLE "CalendarBlock" ADD CONSTRAINT "CalendarBlock_unitId_fkey"
          FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    console.log("Added NOT NULL constraints and foreign keys")

    // Add indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS "Reservation_unitId_checkinDate_idx" ON "Reservation"("unitId", "checkinDate");
      CREATE INDEX IF NOT EXISTS "Task_unitId_idx" ON "Task"("unitId");
      CREATE INDEX IF NOT EXISTS "Transaction_unitId_date_idx" ON "Transaction"("unitId", "date");
      CREATE INDEX IF NOT EXISTS "CalendarBlock_unitId_startDate_endDate_idx" ON "CalendarBlock"("unitId", "startDate", "endDate");
    `)
    console.log("Added indexes for unitId")

    // Migrate PropertyPhoto to UnitPhoto
    await client.query(`
      INSERT INTO "UnitPhoto" ("id", "unitId", "url", "order", "createdAt")
      SELECT
        gen_random_uuid()::text,
        u."id",
        pp."url",
        pp."order",
        pp."createdAt"
      FROM "PropertyPhoto" pp
      JOIN "Unit" u ON u."propertyId" = pp."propertyId"
      WHERE NOT EXISTS (SELECT 1 FROM "UnitPhoto" WHERE "UnitPhoto"."unitId" = u."id" AND "UnitPhoto"."url" = pp."url");
    `)
    console.log("Migrated PropertyPhoto to UnitPhoto")

    // Drop old constraints and columns
    await client.query(`
      ALTER TABLE "Reservation" DROP CONSTRAINT IF EXISTS "Reservation_propertyId_fkey";
      ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_propertyId_fkey";
      ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_propertyId_fkey";
      ALTER TABLE "CalendarBlock" DROP CONSTRAINT IF EXISTS "CalendarBlock_propertyId_fkey";

      DROP INDEX IF EXISTS "Reservation_propertyId_checkinDate_idx";
      DROP INDEX IF EXISTS "Transaction_propertyId_date_idx";
      DROP INDEX IF EXISTS "CalendarBlock_propertyId_startDate_endDate_idx";

      ALTER TABLE "Reservation" DROP COLUMN IF EXISTS "propertyId";
      ALTER TABLE "Task" DROP COLUMN IF EXISTS "propertyId";
      ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "propertyId";
      ALTER TABLE "CalendarBlock" DROP COLUMN IF EXISTS "propertyId";
    `)
    console.log("Dropped old propertyId columns")

    // Drop PropertyPhoto table
    await client.query(`DROP TABLE IF EXISTS "PropertyPhoto";`)
    console.log("Dropped PropertyPhoto table")

    // Remove unit-specific columns from Property
    await client.query(`
      ALTER TABLE "Property" DROP COLUMN IF EXISTS "bedrooms";
      ALTER TABLE "Property" DROP COLUMN IF EXISTS "bathrooms";
      ALTER TABLE "Property" DROP COLUMN IF EXISTS "maxGuests";
      ALTER TABLE "Property" DROP COLUMN IF EXISTS "cleaningFee";
      ALTER TABLE "Property" DROP COLUMN IF EXISTS "adminFeePercent";
    `)
    console.log("Removed unit columns from Property")

    // Make Property.ownerId optional
    await client.query(`
      ALTER TABLE "Property" ALTER COLUMN "ownerId" DROP NOT NULL;
    `)
    console.log("Made Property.ownerId optional")

    console.log("Migration completed successfully!")

  } catch (error) {
    console.error("Migration error:", error)
    throw error
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
