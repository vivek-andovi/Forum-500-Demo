// Set a known password on any account (or all accounts) for local development & testing.
// Usage:
//   node scripts/set-dev-password.mjs dominic@aument-capital.com [optionalPassword]
//   node scripts/set-dev-password.mjs --all [optionalPassword]
// Default password if omitted: Member@12345
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();
const [, , target, customPassword] = process.argv;
const password = customPassword || 'Member@12345';

if (!target) {
  console.log(`Usage:`);
  console.log(`  node scripts/set-dev-password.mjs <email> [password]`);
  console.log(`  node scripts/set-dev-password.mjs --all [password]`);
  console.log(`\nExample:`);
  console.log(`  node scripts/set-dev-password.mjs dominic@aument-capital.com Member@12345`);
  process.exit(1);
}

try {
  const passwordHash = await argon2.hash(password);

  if (target === '--all') {
    const result = await prisma.user.updateMany({
      data: {
        passwordHash,
        failedLogins: 0,
        lockedUntil: null,
      },
    });
    console.log(`\n✅ Reset password for all ${result.count} users in the database.`);
    console.log(`🔑 Password: ${password}\n`);
  } else {
    const email = target.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`\n❌ User not found with email: ${email}`);
      console.log(`You can check available users using: npx prisma studio\n`);
      process.exit(1);
    }
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        failedLogins: 0,
        lockedUntil: null,
        tokenVersion: { increment: 1 },
      },
    });
    console.log(`\n✅ Password successfully updated for: ${email}`);
    console.log(`🔑 Login Password: ${password}\n`);
  }
} catch (err) {
  console.error('Error updating password:', err);
} finally {
  await prisma.$disconnect();
}
