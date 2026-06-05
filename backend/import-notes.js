import { prisma } from './lib/prisma.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const NOTES_DIR = path.join(__dirname, 'notatki_import');

const mapping = [
    { file: 'Analiza Meczu ATOMówek i Rekomendacje.md', opponent: 'ATOMówki' },
    { file: 'Analiza Meczu Koszykówki_ BeKaPaKa vs 100SIO.PL.md', opponent: '100SIO.PL' },
    { file: 'Analiza Meczu Młode Wilki.md', opponent: 'MŁODE WILKI' },
    { file: 'Analiza Meczu i Plan Naprawczy Koszykówki.md', opponent: 'PANTERY' },
    { file: 'Analiza Meczu i Plan Naprawczy.md', opponent: 'BrdCrew' },
    { file: 'Analiza i Plan Treningowy Koszykówki.md', opponent: 'EMET BASKET SZCZECINEK' },
    { file: 'teraz gmvt.md', opponent: 'GMVT TEAM' },
    { file: 'teraz piwiarnia buymerang.md', opponent: 'PIWIARNIA BUMERANG' },
    { file: 'teraz politechnika.md', opponent: 'POLITECHNIKA KOSZALIŃSKA' }
];

function cleanNote(text) {
    if (!text) return "";

    // 1. Remove common AI intros
    let cleaned = text.replace(/^[\s\S]*?(?=#+|\*\*1\.|\*\*1\\?\.|1\.|###)/i, "");

    // 2. Remove common AI outros
    cleaned = cleaned.replace(/(Czy chciałbyś|Daj znać|W razie pytań|Zapraszam do|Dziękuję|Arkusz strzelecki)[\s\S]*?$/i, "");

    // 3. Fix all backslash escapes (Crucial for Markdown symbols)
    cleaned = cleaned.replace(/\\([.!#\-+*\[\]()=_`])/g, "$1");

    // 4. Standardize horizontal rules FIRST
    cleaned = cleaned.replace(/^(#+\s*)?[-*]{3,}\s*$/gm, "---");
    cleaned = cleaned.replace(/###\s+\**-+\**/g, "---");

    // 5. Standardize headers - ensure clean bolding for sub-headers
    // Match # plus any text with optional leading/trailing stars and standardize it to # **Text**
    cleaned = cleaned.replace(/^(#{1,4})\s*[\s*]*(.*?)[\s*]*$/gm, (match, hashes, content) => {
        // Skip horizontal rules
        if (content.match(/^[-*]+$/)) return match;
        return `${hashes} **${content.trim()}**`;
    });

    // 6. Fix list item bolding and spacing
    cleaned = cleaned.replace(/^\*\s*\*\*/gm, "* **");

    // 7. Cleanup spacing and redundant breaks
    cleaned = cleaned.replace(/\s+$/gm, ""); // Trim trailing spaces
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
    cleaned = cleaned.trim();

    return cleaned;
}

async function importNotes() {
    console.log('Starting coach notes import with cleaning...');

    for (const item of mapping) {
        try {
            const filePath = path.join(NOTES_DIR, item.file);
            let content = await fs.readFile(filePath, 'utf-8');

            content = cleanNote(content);

            // Find the game by opponent
            const game = await prisma.game.findFirst({
                where: {
                    opponent: {
                        contains: item.opponent,
                        mode: 'insensitive'
                    }
                }
            });

            if (game) {
                console.log(`Found game vs ${game.opponent} for file ${item.file}. Updating...`);

                // Update both notes column and data JSON
                const nextData = { ...game.data, coachNotes: content };

                await prisma.game.update({
                    where: { id: game.id },
                    data: {
                        notes: content,
                        data: nextData
                    }
                });

                console.log(`Successfully updated notes for game vs ${game.opponent}`);
            } else {
                console.warn(`Could not find game record for opponent: ${item.opponent}`);
            }
        } catch (err) {
            console.error(`Error importing ${item.file}:`, err);
        }
    }

    console.log('Import finished.');
    await prisma.$disconnect();
}

importNotes();
