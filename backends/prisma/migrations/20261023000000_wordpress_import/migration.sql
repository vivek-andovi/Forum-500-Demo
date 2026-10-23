-- AlterEnum
ALTER TYPE "AuthTokenType" ADD VALUE 'magic_link';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventKind" ADD VALUE 'Breakfast';
ALTER TYPE "EventKind" ADD VALUE 'Lunch';
ALTER TYPE "EventKind" ADD VALUE 'Brunch';
ALTER TYPE "EventKind" ADD VALUE 'Drinks';
ALTER TYPE "EventKind" ADD VALUE 'Conference';
ALTER TYPE "EventKind" ADD VALUE 'Party';
ALTER TYPE "EventKind" ADD VALUE 'Other';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LibraryKind" ADD VALUE 'audio';
ALTER TYPE "LibraryKind" ADD VALUE 'video';
ALTER TYPE "LibraryKind" ADD VALUE 'document';
ALTER TYPE "LibraryKind" ADD VALUE 'link';

-- AlterEnum
ALTER TYPE "Publication" ADD VALUE 'report';

-- AlterTable
ALTER TABLE "EmailCampaign" ADD COLUMN     "html" TEXT;

-- AlterTable
ALTER TABLE "InforumEdition" ADD COLUMN     "pdfUrl" TEXT;

-- AlterTable
ALTER TABLE "LibraryItem" ADD COLUMN     "durationLabel" TEXT,
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "recordedOn" TIMESTAMPTZ,
ADD COLUMN     "speaker" TEXT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "companyDescription" TEXT,
ADD COLUMN     "positionLine" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PodcastEpisode" ADD COLUMN     "series" INTEGER;

-- CreateTable
CREATE TABLE "MemberSector" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "sectorId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedBy" TEXT,

    CONSTRAINT "MemberSector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'subscribed',
    "lists" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT,
    "memberId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedBy" TEXT,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyMap" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'wordpress',
    "entity" TEXT NOT NULL,
    "legacyId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "newId" TEXT NOT NULL,
    "oldUrl" TEXT,
    "newUrl" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedBy" TEXT,

    CONSTRAINT "LegacyMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberSector_memberId_sectorId_key" ON "MemberSector"("memberId", "sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_memberId_key" ON "Subscriber"("memberId");

-- CreateIndex
CREATE INDEX "LegacyMap_oldUrl_idx" ON "LegacyMap"("oldUrl");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyMap_source_entity_legacyId_key" ON "LegacyMap"("source", "entity", "legacyId");

-- AddForeignKey
ALTER TABLE "MemberSector" ADD CONSTRAINT "MemberSector_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSector" ADD CONSTRAINT "MemberSector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

