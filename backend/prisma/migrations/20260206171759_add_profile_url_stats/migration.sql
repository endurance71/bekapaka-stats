-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "opponent" TEXT NOT NULL,
    "homeAway" TEXT NOT NULL DEFAULT 'home',
    "result" TEXT,
    "scoreUs" INTEGER,
    "scoreThem" INTEGER,
    "teamStats" JSONB,
    "playerStats" JSONB,
    "notes" TEXT,
    "mvp" TEXT,
    "videoUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RosterPlayer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "number" INTEGER,
    "position" TEXT,
    "birthDate" TEXT,
    "heightCm" INTEGER,
    "starter" BOOLEAN NOT NULL DEFAULT false,
    "kalkPlayerId" TEXT,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "ppg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rpg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "apg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fgPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "threePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ftPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tsPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eFgPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "plusMinus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pts" INTEGER NOT NULL DEFAULT 0,
    "fgm" INTEGER NOT NULL DEFAULT 0,
    "fga" INTEGER NOT NULL DEFAULT 0,
    "threePm" INTEGER NOT NULL DEFAULT 0,
    "threePa" INTEGER NOT NULL DEFAULT 0,
    "ftm" INTEGER NOT NULL DEFAULT 0,
    "fta" INTEGER NOT NULL DEFAULT 0,
    "orb" INTEGER NOT NULL DEFAULT 0,
    "drb" INTEGER NOT NULL DEFAULT 0,
    "reb" INTEGER NOT NULL DEFAULT 0,
    "ast" INTEGER NOT NULL DEFAULT 0,
    "stl" INTEGER NOT NULL DEFAULT 0,
    "blk" INTEGER NOT NULL DEFAULT 0,
    "tov" INTEGER NOT NULL DEFAULT 0,
    "goals" JSONB,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RosterPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KalkPlayer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "team" TEXT,
    "pointsTotal" DOUBLE PRECISION,
    "pointsAverage" DOUBLE PRECISION,
    "matchesPlayed" INTEGER,
    "eval" DOUBLE PRECISION,
    "profileUrl" TEXT,
    "threePointStats" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KalkPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KalkScrapeRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "message" TEXT,
    "filePath" TEXT NOT NULL,
    "newPlayers" JSONB,
    "log" JSONB,

    CONSTRAINT "KalkScrapeRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "focus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attendance" JSONB,
    "notes" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Play" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "diagram" TEXT,
    "description" TEXT,
    "videoUrl" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "successes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Play_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "pointsFor" INTEGER NOT NULL DEFAULT 0,
    "pointsAgainst" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueMatch" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "guestTeam" TEXT NOT NULL,
    "scoreHome" INTEGER,
    "scoreAway" INTEGER,
    "isFinished" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RosterPlayer_kalkPlayerId_key" ON "RosterPlayer"("kalkPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueTeam_name_key" ON "LeagueTeam"("name");

-- AddForeignKey
ALTER TABLE "RosterPlayer" ADD CONSTRAINT "RosterPlayer_kalkPlayerId_fkey" FOREIGN KEY ("kalkPlayerId") REFERENCES "KalkPlayer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
