
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGlazurix() {
    const team = await prisma.leagueTeam.findFirst({
        where: { name: { contains: "GLAZURIX", mode: "insensitive" } }
    });
    console.log("Team found:", team);

    if (!team) {
        console.log("No team found matching 'GLAZURIX'");
    } else {
        // Find players assigned to this team in KalkPlayer by name matching or direct assignment
        // We try to find players who have 'team' field containing Glazurix
        const players = await prisma.kalkPlayer.findMany({
            where: { team: { contains: "GLAZURIX", mode: "insensitive" } }
        });
        console.log("Players assigned to GLAZURIX in DB:", players.length);
        players.forEach(p => console.log(`- ${p.name} (Team: ${p.team})`));
    }
}

checkGlazurix()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
