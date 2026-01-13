/*
  Warnings:

  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `eligibility` on the `Grant` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Notification";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Grant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "agency" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "amountMin" INTEGER,
    "amountMax" INTEGER,
    "deadline" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "tags" TEXT NOT NULL,
    "issueArea" TEXT,
    "eligibilityCriteria" TEXT,
    "kpis" TEXT,
    "grantDuration" INTEGER,
    "sourceId" TEXT,
    "scrapedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Grant" ("agency", "amount", "amountMax", "amountMin", "createdAt", "deadline", "description", "id", "tags", "title", "updatedAt", "url") SELECT "agency", "amount", "amountMax", "amountMin", "createdAt", "deadline", "description", "id", "tags", "title", "updatedAt", "url" FROM "Grant";
DROP TABLE "Grant";
ALTER TABLE "new_Grant" RENAME TO "Grant";
CREATE UNIQUE INDEX "Grant_sourceId_key" ON "Grant"("sourceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
