
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugScouting() {
    const opponentName = "GLAZURIX-Salon Łazienek";
    const simplifiedName = opponentName.split('-')[0].trim();
    console.log(`Opponent: ${opponentName}`);
    console.log(`Simplified: ${simplifiedName}`);

    const matches = await prisma.leagueMatch.findMany({
        where: {
            OR: [
                { homeTeam: { contains: simplifiedName, mode: 'insensitive' } },
                { guestTeam: { contains: simplifiedName, mode: 'insensitive' } }
            ],
            isFinished: true,
            protocolUrl: { not: null }
        },
        orderBy: { date: 'desc' },
        take: 5
    });

    console.log(`Found ${matches.length} matches.`);

    let totalMatches = 0;
    let totalPts = 0;
    let totalPoss = 0;

    for (const match of matches) {
        console.log(`\nMatch: ${match.homeTeam} vs ${match.guestTeam}`);
        let details = match.details;

        if (!details || !details.teams) {
            console.log("  No details/teams.");
            continue;
        }

        const isHome = match.homeTeam.toLowerCase().includes(simplifiedName.toLowerCase());
        console.log(`  isHome: ${isHome} (Checked "${match.homeTeam}" includes "${simplifiedName}")`);

        const oppTeamData = isHome ? details.teams[0] : details.teams[1];
        const enemyTeamData = isHome ? details.teams[1] : details.teams[0];

        console.log(`  Selected Team: ${oppTeamData.name} (Pts: ${oppTeamData.fourFactors.pts})`);
        // console.log(`  Other Team: ${enemyTeamData.name}`);

        totalMatches++;
        totalPts += oppTeamData.fourFactors.pts;
        const ff = oppTeamData.fourFactors;
        const poss = ff.fga + 0.44 * ff.fta + ff.tov - ff.orb;
        totalPoss += poss;

        if (oppTeamData.players) {
            const keyPlayers = oppTeamData.players.slice(0, 3).map(p => p.name).join(', ');
            // console.log(`  Players included: ${keyPlayers}`);
        }
    }

    const ppg = totalMatches > 0 ? (totalPts / totalMatches).toFixed(1) : 0;
    const pace = totalMatches > 0 ? (totalPoss / totalMatches).toFixed(1) : 0;

    console.log(`\n--- Calculated Aggregates (Last ${totalMatches} games) ---`);
    console.log(`PPG: ${ppg}`);
    console.log(`Pace: ${pace}`);
}

debugScouting()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
