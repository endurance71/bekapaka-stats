-- Provider API keys entered in Studio (encrypted with STUDIO_SECRETS_KEY). Additive only.
CREATE TABLE "StudioSecret" (
    "ownerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "lastTestOk" BOOLEAN,
    "lastTestedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioSecret_pkey" PRIMARY KEY ("ownerId","provider")
);
