-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "aiSummaryAt" TIMESTAMP(3),
ADD COLUMN     "aiSummaryModel" TEXT,
ADD COLUMN     "aiSummaryHash" TEXT;

-- AlterTable
ALTER TABLE "RosterPlayer" ADD COLUMN     "aiDevelopmentSummary" TEXT,
ADD COLUMN     "aiDevelopmentAt" TIMESTAMP(3),
ADD COLUMN     "aiDevelopmentModel" TEXT,
ADD COLUMN     "aiDevelopmentHash" TEXT;

-- CreateTable
CREATE TABLE "ScoutingAiReport" (
    "opponentKey" TEXT NOT NULL,
    "opponentName" TEXT NOT NULL,
    "summaryMd" TEXT NOT NULL,
    "analysisJson" JSONB,
    "model" TEXT,
    "sourceHash" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutingAiReport_pkey" PRIMARY KEY ("opponentKey")
);

-- CreateTable
CREATE TABLE "TeamBriefing" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "contentMd" TEXT NOT NULL,
    "model" TEXT,
    "sourceHash" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamBriefing_pkey" PRIMARY KEY ("id")
);
