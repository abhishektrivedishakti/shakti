import { prisma } from '../prisma';
import type { Prisma } from '../generated/prisma';

type Tx = Prisma.TransactionClient;

/**
 * One DB transaction for a bulk import — much faster than per-row autocommit on SQLite.
 */
export async function withBulkTransaction<T>(
  work: (tx: Tx) => Promise<T>,
  timeoutMs = 120_000
): Promise<T> {
  return prisma.$transaction(work, { timeout: timeoutMs, maxWait: 10_000 });
}

/**
 * Run async work over items in small parallel batches (use outside transactions).
 */
export async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  worker: (item: T, index: number) => Promise<R | null | undefined>
): Promise<R[]> {
  const size = Math.max(1, Math.min(batchSize, 25));
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size);
    const chunk = await Promise.all(slice.map((item, offset) => worker(item, i + offset)));
    for (const row of chunk) {
      if (row != null) out.push(row);
    }
  }
  return out;
}
