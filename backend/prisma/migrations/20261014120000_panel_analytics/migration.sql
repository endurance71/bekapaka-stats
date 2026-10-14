-- Panel usage analytics: per-user daily activity and page views. Additive only.
CREATE TABLE "PanelActivityDay" (
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "firstAt" TIMESTAMP(3) NOT NULL,
    "lastAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PanelActivityDay_pkey" PRIMARY KEY ("userId","day")
);

CREATE TABLE "PanelPageViewDay" (
    "userId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "page" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PanelPageViewDay_pkey" PRIMARY KEY ("userId","day","page")
);

CREATE INDEX "PanelActivityDay_day_idx" ON "PanelActivityDay"("day");
CREATE INDEX "PanelPageViewDay_day_idx" ON "PanelPageViewDay"("day");

ALTER TABLE "PanelActivityDay" ADD CONSTRAINT "PanelActivityDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RosterPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PanelPageViewDay" ADD CONSTRAINT "PanelPageViewDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RosterPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
