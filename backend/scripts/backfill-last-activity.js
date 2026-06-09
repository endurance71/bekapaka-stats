/**
 * Jednorazowy backfill lastActivityAt z udanych wpisów LoginLog.
 * Uruchom: node backend/scripts/backfill-last-activity.js
 */
import { prisma } from '../lib/prisma.js';

async function backfillLastActivity() {
  const usersWithLogin = await prisma.rosterPlayer.findMany({
    where: { username: { not: null } },
    select: { id: true, username: true, lastActivityAt: true }
  });

  let updated = 0;
  let skipped = 0;

  for (const user of usersWithLogin) {
    const lastSuccess = await prisma.loginLog.findFirst({
      where: {
        username: { equals: user.username, mode: 'insensitive' },
        success: true
      },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true, ipAddress: true }
    });

    if (!lastSuccess) {
      skipped += 1;
      continue;
    }

    if (user.lastActivityAt && user.lastActivityAt >= lastSuccess.timestamp) {
      skipped += 1;
      continue;
    }

    await prisma.rosterPlayer.update({
      where: { id: user.id },
      data: {
        lastActivityAt: lastSuccess.timestamp,
        lastActivityIp: lastSuccess.ipAddress ?? undefined
      }
    });
    updated += 1;
    console.log(`Updated ${user.username}: ${lastSuccess.timestamp.toISOString()}`);
  }

  console.log(`Backfill done. Updated: ${updated}, skipped: ${skipped}`);
}

backfillLastActivity()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
