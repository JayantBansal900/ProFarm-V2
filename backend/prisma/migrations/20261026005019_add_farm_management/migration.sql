-- CreateTable
CREATE TABLE "crop_cycles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "variety" TEXT,
    "sowingDate" TEXT NOT NULL,
    "expectedHarvestDate" TEXT,
    "actualHarvestDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "cultivatedArea" REAL,
    "areaUnit" TEXT DEFAULT 'acres',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "crop_cycles_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "farm_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "cropCycleId" TEXT,
    "category" TEXT NOT NULL,
    "activityDate" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "farm_activities_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "farm_activities_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "farm_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "cropCycleId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "farm_tasks_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "farm_tasks_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_farms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT,
    "district" TEXT,
    "village" TEXT,
    "pincode" TEXT,
    "area" REAL,
    "areaUnit" TEXT DEFAULT 'acres',
    "soilType" TEXT,
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "farms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_farms" ("createdAt", "district", "id", "name", "pincode", "soilType", "state", "updatedAt", "userId") SELECT "createdAt", "district", "id", "name", "pincode", "soilType", "state", "updatedAt", "userId" FROM "farms";
DROP TABLE "farms";
ALTER TABLE "new_farms" RENAME TO "farms";
CREATE INDEX "farms_userId_idx" ON "farms"("userId");
CREATE INDEX "farms_userId_isArchived_idx" ON "farms"("userId", "isArchived");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "crop_cycles_farmId_idx" ON "crop_cycles"("farmId");

-- CreateIndex
CREATE INDEX "crop_cycles_farmId_status_idx" ON "crop_cycles"("farmId", "status");

-- CreateIndex
CREATE INDEX "farm_activities_farmId_idx" ON "farm_activities"("farmId");

-- CreateIndex
CREATE INDEX "farm_activities_farmId_category_idx" ON "farm_activities"("farmId", "category");

-- CreateIndex
CREATE INDEX "farm_activities_cropCycleId_idx" ON "farm_activities"("cropCycleId");

-- CreateIndex
CREATE INDEX "farm_tasks_farmId_idx" ON "farm_tasks"("farmId");

-- CreateIndex
CREATE INDEX "farm_tasks_farmId_status_idx" ON "farm_tasks"("farmId", "status");

-- CreateIndex
CREATE INDEX "farm_tasks_dueDate_idx" ON "farm_tasks"("dueDate");

-- CreateIndex
CREATE INDEX "farm_tasks_cropCycleId_idx" ON "farm_tasks"("cropCycleId");
