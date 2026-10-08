-- CreateTable
CREATE TABLE "StudioCopyCache" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioCopyCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioAgentToken" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioAgentToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudioCopyCache_ownerId_createdAt_idx" ON "StudioCopyCache"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "StudioAgentToken_ownerId_idx" ON "StudioAgentToken"("ownerId");

