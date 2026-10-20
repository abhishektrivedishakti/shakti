import { PrismaClient } from './generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSqliteTuned?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/** SQLite: WAL + reasonable sync for faster local CRUD without waiting on every fsync. */
export async function tuneSqliteForSpeed(): Promise<void> {
  if (globalForPrisma.prismaSqliteTuned) return;
  try {
    // journal_mode returns a row — must use queryRaw, not executeRaw
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL');
    await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL');
    await prisma.$queryRawUnsafe('PRAGMA temp_store = MEMORY');
    await prisma.$queryRawUnsafe('PRAGMA cache_size = -64000');
    globalForPrisma.prismaSqliteTuned = true;
  } catch (err) {
    console.warn('SQLite tune skipped:', err);
  }
}
