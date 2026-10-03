-- CreateTable
CREATE TABLE "StudioProject" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currentRevision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioRevision" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "brandVersion" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioAsset" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "origin" TEXT NOT NULL,
    "people" TEXT NOT NULL DEFAULT '',
    "jerseyNumber" TEXT NOT NULL DEFAULT '',
    "consent" TEXT NOT NULL DEFAULT 'unknown',
    "storageKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "provenance" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioPartner" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assetId" TEXT,
    "seedLogo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "contractNote" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioTemplate" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "brandVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "StudioTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioApproval" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioJob" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "projectId" TEXT,
    "revision" INTEGER,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "error" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "leaseToken" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "StudioJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioExport" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "jobId" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "files" JSONB NOT NULL,
    "storageKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioAiUsage" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "reservedMicros" INTEGER NOT NULL,
    "chargedMicros" INTEGER,
    "model" TEXT NOT NULL,
    "pricingVersion" TEXT NOT NULL,
    "usage" JSONB,
    "status" TEXT NOT NULL DEFAULT 'reserved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioAiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioSession" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudioProject_ownerId_updatedAt_idx" ON "StudioProject"("ownerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudioRevision_projectId_number_key" ON "StudioRevision"("projectId", "number");

-- CreateIndex
CREATE INDEX "StudioAsset_ownerId_status_idx" ON "StudioAsset"("ownerId", "status");

-- CreateIndex
CREATE INDEX "StudioPartner_ownerId_status_idx" ON "StudioPartner"("ownerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StudioTemplate_ownerId_family_version_brandVersion_key" ON "StudioTemplate"("ownerId", "family", "version", "brandVersion");

-- CreateIndex
CREATE UNIQUE INDEX "StudioApproval_revisionId_ownerId_key" ON "StudioApproval"("revisionId", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioJob_idempotencyKey_key" ON "StudioJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "StudioJob_status_kind_createdAt_idx" ON "StudioJob"("status", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "StudioJob_ownerId_projectId_idx" ON "StudioJob"("ownerId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioExport_jobId_key" ON "StudioExport"("jobId");

-- CreateIndex
CREATE INDEX "StudioExport_ownerId_createdAt_idx" ON "StudioExport"("ownerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudioAiUsage_jobId_key" ON "StudioAiUsage"("jobId");

-- CreateIndex
CREATE INDEX "StudioAiUsage_ownerId_month_idx" ON "StudioAiUsage"("ownerId", "month");

-- CreateIndex
CREATE INDEX "StudioSession_expiresAt_idx" ON "StudioSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "StudioRevision" ADD CONSTRAINT "StudioRevision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "StudioProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioApproval" ADD CONSTRAINT "StudioApproval_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "StudioRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioJob" ADD CONSTRAINT "StudioJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "StudioProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioExport" ADD CONSTRAINT "StudioExport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "StudioProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
