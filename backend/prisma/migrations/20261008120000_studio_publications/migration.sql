-- CreateTable
CREATE TABLE "StudioPublication" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "playbook" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "facts" JSONB NOT NULL,
    "factsHash" TEXT NOT NULL,
    "factsConfirmedHash" TEXT,
    "sourceRef" JSONB,
    "plannedAt" TIMESTAMP(3),
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioPublicationItem" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "projectId" TEXT,
    "format" TEXT,
    "copy" JSONB NOT NULL,
    "copyOrigin" TEXT NOT NULL DEFAULT 'manual',
    "promptVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedHash" TEXT,
    "plannedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "externalId" TEXT,
    "externalUrl" TEXT,
    "error" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioPublicationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioPublishEvent" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioPublishEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioSetting" (
    "ownerId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioSetting_pkey" PRIMARY KEY ("ownerId","key")
);

-- CreateIndex
CREATE INDEX "StudioPublication_ownerId_status_plannedAt_idx" ON "StudioPublication"("ownerId", "status", "plannedAt");

-- CreateIndex
CREATE INDEX "StudioPublicationItem_status_plannedAt_idx" ON "StudioPublicationItem"("status", "plannedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudioPublicationItem_publicationId_channel_key" ON "StudioPublicationItem"("publicationId", "channel");

-- CreateIndex
CREATE INDEX "StudioPublishEvent_itemId_createdAt_idx" ON "StudioPublishEvent"("itemId", "createdAt");

-- AddForeignKey
ALTER TABLE "StudioPublicationItem" ADD CONSTRAINT "StudioPublicationItem_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "StudioPublication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioPublicationItem" ADD CONSTRAINT "StudioPublicationItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "StudioProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioPublishEvent" ADD CONSTRAINT "StudioPublishEvent_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StudioPublicationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

