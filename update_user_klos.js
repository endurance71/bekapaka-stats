
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLogin() {
    try {
        const user = await prisma.rosterPlayer.findFirst({
            where: { lastName: 'Kłos', firstName: 'Emil' }
        });

        if (!user) {
            console.log('User Emil Kłos not found!');
            return;
        }

        console.log(`Found user: ${user.firstName} ${user.lastName} (${user.username})`);

        const updated = await prisma.rosterPlayer.update({
            where: { id: user.id },
            data: {
                username: 'klos'
            }
        });

        console.log(`User updated successfully: ${updated.username}`);
    } catch (e) {
        console.error('Error updating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

updateLogin();
