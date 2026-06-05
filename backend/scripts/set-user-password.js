/**
 * One-off: set bcrypt password for a roster user by username.
 * Usage (never commit the password):
 *   SET_PASSWORD='...' node backend/scripts/set-user-password.js motylinski
 */
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

const username = (process.argv[2] || '').toLowerCase().trim();
const plain = process.env.SET_PASSWORD;

if (!username) {
  console.error('Usage: SET_PASSWORD=... node scripts/set-user-password.js <username>');
  process.exit(1);
}

if (!plain || plain.length < 8) {
  console.error('SET_PASSWORD must be set (min 8 characters).');
  process.exit(1);
}


try {
  const user = await prisma.rosterPlayer.findFirst({
    where: { username }
  });

  if (!user) {
    console.error(`User not found: ${username}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(plain, 10);
  await prisma.rosterPlayer.update({
    where: { id: user.id },
    data: { password: passwordHash }
  });

  console.log(`Password updated for user id=${user.id} username=${username}`);
} finally {
  await prisma.$disconnect();
}
