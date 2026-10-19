-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('invite', 'password_reset');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "driver" TEXT NOT NULL DEFAULT 'local',
ADD COLUMN     "uploadedBy" UUID;

-- AlterTable
ALTER TABLE "AuditLog" RENAME COLUMN "diff" TO "changes";

ALTER TABLE "AuditLog" ADD COLUMN     "actorEmail" TEXT,
ADD COLUMN     "actorName" TEXT,
ADD COLUMN     "entityLabel" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "ip" TEXT,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedLogins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMPTZ,
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "usedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

