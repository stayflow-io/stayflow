-- Migration: Add Unit model
-- This migration creates the Unit model and migrates data from Property

-- 1. Create UnitStatus enum
CREATE TYPE "UnitStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- 2. Create Unit table
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT,
    "name" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "description" TEXT,
    "amenities" TEXT[],
    "cleaningFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "adminFeePercent" DECIMAL(65,30) NOT NULL DEFAULT 20,
    "status" "UnitStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- 3. Create UnitPhoto table
CREATE TABLE "UnitPhoto" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitPhoto_pkey" PRIMARY KEY ("id")
);

-- 4. Add indexes to Unit
CREATE INDEX "Unit_propertyId_idx" ON "Unit"("propertyId");
CREATE INDEX "Unit_ownerId_idx" ON "Unit"("ownerId");
CREATE INDEX "Unit_propertyId_status_idx" ON "Unit"("propertyId", "status");

-- 5. Add foreign keys to Unit
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Add foreign keys to UnitPhoto
ALTER TABLE "UnitPhoto" ADD CONSTRAINT "UnitPhoto_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Create Unit for each existing Property (migration)
INSERT INTO "Unit" ("id", "propertyId", "ownerId", "name", "bedrooms", "bathrooms", "maxGuests", "description", "amenities", "cleaningFee", "adminFeePercent", "status", "createdAt", "updatedAt", "deletedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    NULL, -- owner will come from property
    "name", -- use property name as unit name
    "bedrooms",
    "bathrooms",
    "maxGuests",
    "description",
    "amenities",
    "cleaningFee",
    "adminFeePercent",
    CASE "status"
        WHEN 'ACTIVE' THEN 'ACTIVE'::"UnitStatus"
        WHEN 'INACTIVE' THEN 'INACTIVE'::"UnitStatus"
        WHEN 'MAINTENANCE' THEN 'MAINTENANCE'::"UnitStatus"
    END,
    "createdAt",
    "updatedAt",
    "deletedAt"
FROM "Property";

-- 8. Add unitId column to Reservation, Task, Transaction, CalendarBlock
ALTER TABLE "Reservation" ADD COLUMN "unitId" TEXT;
ALTER TABLE "Task" ADD COLUMN "unitId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "unitId" TEXT;
ALTER TABLE "CalendarBlock" ADD COLUMN "unitId" TEXT;

-- 9. Populate unitId from propertyId (find the unit that was created for each property)
UPDATE "Reservation" r
SET "unitId" = u."id"
FROM "Unit" u
WHERE u."propertyId" = r."propertyId";

UPDATE "Task" t
SET "unitId" = u."id"
FROM "Unit" u
WHERE u."propertyId" = t."propertyId";

UPDATE "Transaction" t
SET "unitId" = u."id"
FROM "Unit" u
WHERE u."propertyId" = t."propertyId";

UPDATE "CalendarBlock" cb
SET "unitId" = u."id"
FROM "Unit" u
WHERE u."propertyId" = cb."propertyId";

-- 10. Make unitId NOT NULL and add foreign keys
ALTER TABLE "Reservation" ALTER COLUMN "unitId" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "unitId" SET NOT NULL;
ALTER TABLE "Transaction" ALTER COLUMN "unitId" SET NOT NULL;
ALTER TABLE "CalendarBlock" ALTER COLUMN "unitId" SET NOT NULL;

ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalendarBlock" ADD CONSTRAINT "CalendarBlock_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 11. Add indexes for unitId
CREATE INDEX "Reservation_unitId_checkinDate_idx" ON "Reservation"("unitId", "checkinDate");
CREATE INDEX "Task_unitId_idx" ON "Task"("unitId");
CREATE INDEX "Transaction_unitId_date_idx" ON "Transaction"("unitId", "date");
CREATE INDEX "CalendarBlock_unitId_startDate_endDate_idx" ON "CalendarBlock"("unitId", "startDate", "endDate");

-- 12. Migrate PropertyPhoto to UnitPhoto
INSERT INTO "UnitPhoto" ("id", "unitId", "url", "order", "createdAt")
SELECT
    gen_random_uuid()::text,
    u."id",
    pp."url",
    pp."order",
    pp."createdAt"
FROM "PropertyPhoto" pp
JOIN "Unit" u ON u."propertyId" = pp."propertyId";

-- 13. Drop old columns and constraints
ALTER TABLE "Reservation" DROP CONSTRAINT IF EXISTS "Reservation_propertyId_fkey";
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_propertyId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_propertyId_fkey";
ALTER TABLE "CalendarBlock" DROP CONSTRAINT IF EXISTS "CalendarBlock_propertyId_fkey";

DROP INDEX IF EXISTS "Reservation_propertyId_checkinDate_idx";
DROP INDEX IF EXISTS "Transaction_propertyId_date_idx";
DROP INDEX IF EXISTS "CalendarBlock_propertyId_startDate_endDate_idx";

ALTER TABLE "Reservation" DROP COLUMN "propertyId";
ALTER TABLE "Task" DROP COLUMN "propertyId";
ALTER TABLE "Transaction" DROP COLUMN "propertyId";
ALTER TABLE "CalendarBlock" DROP COLUMN "propertyId";

-- 14. Drop PropertyPhoto table (data migrated to UnitPhoto)
DROP TABLE "PropertyPhoto";

-- 15. Remove unit-specific columns from Property (now in Unit)
ALTER TABLE "Property" DROP COLUMN "bedrooms";
ALTER TABLE "Property" DROP COLUMN "bathrooms";
ALTER TABLE "Property" DROP COLUMN "maxGuests";
ALTER TABLE "Property" DROP COLUMN "cleaningFee";
ALTER TABLE "Property" DROP COLUMN "adminFeePercent";

-- 16. Make Property.ownerId optional
ALTER TABLE "Property" ALTER COLUMN "ownerId" DROP NOT NULL;
