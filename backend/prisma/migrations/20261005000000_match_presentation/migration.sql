ALTER TABLE "Game" ADD COLUMN "presentation" JSONB, ADD COLUMN "presentationUpdatedAt" TIMESTAMP(3);
ALTER TABLE "KalkMatch" ADD COLUMN "presentation" JSONB, ADD COLUMN "presentationUpdatedAt" TIMESTAMP(3);
