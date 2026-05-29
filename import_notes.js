
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const prisma = new PrismaClient();

async function importNotes() {
    try {
        const rawData = fs.readFileSync('/app/coach_notes_export.json', 'utf-8');
        const gamesToImport = JSON.parse(rawData);

        console.log(`Found ${gamesToImport.length} games to process.`);

        for (const gameData of gamesToImport) {
            console.log(`Processing game vs ${gameData.opponent} (${gameData.date})...`);

            const date = new Date(gameData.date);
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);
            const prevDay = new Date(date);
            prevDay.setDate(date.getDate() - 1);

            let game = await prisma.game.findFirst({
                where: {
                    opponent: { equals: gameData.opponent, mode: 'insensitive' },
                    date: {
                        gte: prevDay,
                        lt: nextDay
                    }
                }
            });

            if (game) {
                console.log(`Matched game ID: ${game.id}. Updating notes...`);
                await prisma.game.update({
                    where: { id: game.id },
                    data: { notes: gameData.notes }
                });
            } else {
                console.log(`No matching game found for ${gameData.opponent} at ${gameData.date}`);
            }
        }
        console.log('Import complete.');
    } catch (error) {
        console.error('Error importing notes:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importNotes();
