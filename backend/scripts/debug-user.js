
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUser() {
    const users = await prisma.rosterPlayer.findMany({
        where: {
            username: {
                contains: 'motylinski'
            }
        }
    });

    console.log('--- FOUND USERS ---');
    console.log(JSON.stringify(users, null, 2));

    if (users.length > 0) {
        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.default.compare('bekapaka2026', users[0].password);
        console.log('Password "bekapaka2026" valid for first user:', isValid);
    }

    console.log('--- TESTING LOG CREATION ---');
    try {
        const newLog = await prisma.loginLog.create({
            data: {
                username: 'test_user',
                success: true,
                ipAddress: '127.0.0.1',
                timestamp: new Date()
            }
        });
        console.log('Successfully created test log:', newLog.id);
    } catch (e) {
        console.error('FAILED TO CREATE LOG:', e.message);
    }

    const logs = await prisma.loginLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 5
    });

    console.log('--- RECENT LOGIN LOGS ---');
    console.log(JSON.stringify(logs, null, 2));
}

checkUser()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
