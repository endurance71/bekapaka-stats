-- AI text engine switch (API ↔ Claude Agent SDK), its audit trail and a generation log. Additive only.
CREATE TABLE "AiEngineSetting" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "engine" TEXT NOT NULL DEFAULT 'api',
    "agentSdkModel" TEXT,
    "fallbackToApi" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "updatedFrom" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiEngineSetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiSettingAudit" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSettingAudit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiGenerationLog" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "requestedEngine" TEXT NOT NULL,
    "actualEngine" TEXT NOT NULL,
    "model" TEXT,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "costMicros" INTEGER,
    "costKind" TEXT NOT NULL DEFAULT 'none',

    CONSTRAINT "AiGenerationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiSettingAudit_createdAt_idx" ON "AiSettingAudit"("createdAt");
CREATE INDEX "AiGenerationLog_actualEngine_startedAt_idx" ON "AiGenerationLog"("actualEngine", "startedAt");
CREATE INDEX "AiGenerationLog_operation_startedAt_idx" ON "AiGenerationLog"("operation", "startedAt");
