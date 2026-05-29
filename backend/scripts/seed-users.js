
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
    console.log('Seeding users...');

    const players = await prisma.rosterPlayer.findMany();
    const passwordHash = await bcrypt.hash('bekapaka2026', 10);

    if (players.length === 0) {
        await prisma.rosterPlayer.create({
            data: {
                firstName: 'Damian',
                lastName: 'Motylinski',
                username: 'motylinski',
                password: passwordHash,
                role: 'ADMIN',
                starter: false
            }
        });
        console.log('Created fallback admin user: motylinski');
        console.log('User seeding complete.');
        return;
    }

    for (const player of players) {
        // Normalize last name to create username
        // Remove diacritics and convert to lowercase
        const username = player.lastName
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

        const normalizedName = player.lastName
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        const role = normalizedName.includes('motylinski') ? 'ADMIN' : 'USER';

        console.log(`Updating user: ${player.lastName} -> ${username} (${role})`);

        try {
            await prisma.rosterPlayer.update({
                where: { id: player.id },
                data: {
                    username,
                    password: passwordHash,
                    role
                }
            });
        } catch (e) {
            console.error(`Failed to update ${player.lastName}:`, e.message);
        }
    }

    console.log('User seeding complete.');
}

seedUsers()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
