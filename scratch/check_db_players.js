import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const players = await prisma.rosterPlayer.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      aiDevelopmentSummary: true,
      aiDevelopmentAt: true,
      aiDevelopmentModel: true
    }
  });

  for (const p of players) {
    console.log(`Player: ${p.firstName} ${p.lastName} (${p.id})`);
    if (p.aiDevelopmentSummary) {
      console.log(`  AI Summary (length: ${p.aiDevelopmentSummary.length}):`);
      console.log(`  Preview: "${p.aiDevelopmentSummary.slice(0, 300)}..."`);
      console.log(`  Ends with: "...${p.aiDevelopmentSummary.slice(-100)}"`);
    } else {
      console.log("  No AI Summary generated.");
    }
    console.log("-" * 40);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
