import { PrismaClient, Role, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const phone = process.env.ADMIN_PHONE?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !phone || !password || password.length < 12) {
    throw new Error('ADMIN_EMAIL, ADMIN_PHONE and an ADMIN_PASSWORD of at least 12 characters are required to seed the Super Admin.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.SUPER_ADMIN, status: AccountStatus.ACTIVE, emailVerified: true, phoneVerified: true },
    create: {
      email, phone, passwordHash,
      fullName: process.env.ADMIN_FULL_NAME || 'Kasuwar Kanawa Super Admin',
      role: Role.SUPER_ADMIN, status: AccountStatus.ACTIVE,
      emailVerified: true, phoneVerified: true,
    },
  });
  console.log('Initial Super Admin seeded from environment.');
}

main().finally(async () => prisma.$disconnect());
