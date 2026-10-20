-- Post-match graphic set: a channel variant may carry more graphics after its cover (projectId). Additive only.
ALTER TABLE "StudioPublicationItem" ADD COLUMN "extraProjectIds" JSONB NOT NULL DEFAULT '[]';
