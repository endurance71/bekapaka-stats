
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addLogin() {
    try {
        const user = await prisma.rosterPlayer.findFirst({
            where: { lastName: 'Trawiński', firstName: 'Marcin' }
        });

        if (!user) {
            console.log('User Marcin Trawiński not found!');
            return;
        }

        console.log(`Found user: ${user.firstName} ${user.lastName} (${user.id})`);

        const passwordHash = await bcrypt.hash('bekapaka2026', 10);

        const updated = await prisma.rosterPlayer.update({
            where: { id: user.id },
            data: {
                username: 'trawinski',
                password: passwordHash,
                role: 'USER'
            }
        });

        console.log(`User updated successfully: ${updated.username}`);
    } catch (e) {
        console.error('Error updating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

addLogin();
