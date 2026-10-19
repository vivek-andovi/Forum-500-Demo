// Create (or reset) an admin login on any environment, including production.
// Uses only production dependencies, so it runs inside the deployed container:
//   node scripts/create-admin.mjs admin@forum500.club 'A-strong-password-123'
// On ECS: run it as a one-off task with a command override (see docs/TERRAFORM.md).
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const [, , rawEmail, password] = process.argv;
const email = (rawEmail ?? '').trim().toLowerCase();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password>');
  process.exit(1);
}
if (password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  console.error('Password must be at least 10 characters and contain a letter and a number.');
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const passwordHash = await argon2.hash(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'admin', status: 'active', passwordHash, failedLogins: 0, lockedUntil: null, tokenVersion: { increment: 1 } },
    create: { email, role: 'admin', status: 'active', passwordHash },
  });
  await prisma.auditLog.create({
    data: { actorEmail: 'system', actorName: 'System', action: 'create', entity: 'users', entityType: 'User', entityId: user.id, entityLabel: email, summary: `Admin login created or reset for ${email} (create-admin script)` },
  });
  console.log(`Admin ready: ${email}`);
} finally {
  await prisma.$disconnect();
}
