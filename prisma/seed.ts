import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../server/generated/prisma';
import { fullAdminPermissions } from '../server/lib/permissions';

const prisma = new PrismaClient();

function normalizeMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? digits : null;
}

async function main() {
  const name = process.env.SEED_ADMIN_NAME?.trim() || 'Shakti Admin';
  const email = (process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@shakti.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'Password@123';
  const mobile = normalizeMobile(process.env.SEED_ADMIN_MOBILE || '9999888877');

  if (!email.includes('@')) {
    throw new Error('SEED_ADMIN_EMAIL must be a valid email address.');
  }
  if (password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters.');
  }

  const pinHash = await bcrypt.hash(password, 10);
  const permissions = fullAdminPermissions();

  if (mobile) {
    await prisma.user.updateMany({
      where: { mobile, NOT: { email } },
      data: { mobile: null },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email },
    create: {
      name,
      email,
      ...(mobile ? { mobile } : {}),
      pinHash,
      designation: 'Managing Director / System Admin',
      role: 'admin',
      avatarColor: 'bg-indigo-600',
      status: 'active',
      permissions,
    },
    update: {
      name,
      ...(mobile ? { mobile } : { mobile: null }),
      pinHash,
      designation: 'Managing Director / System Admin',
      role: 'admin',
      avatarColor: 'bg-indigo-600',
      status: 'active',
      permissions,
    },
  });

  console.log('Admin user ready for login:');
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: (value of SEED_ADMIN_PASSWORD, default Password@123 in dev)`);
  console.log(`  Role:     ${admin.role}`);
  if (admin.mobile) {
    console.log(`  Mobile:   +91 ${admin.mobile} (profile only)`);
  }
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
