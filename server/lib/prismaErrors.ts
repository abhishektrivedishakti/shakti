import { Prisma } from '../generated/prisma';

/** Map Prisma failures to a short client-safe message (or null to use default). */
export function prismaClientErrorMessage(err: unknown): string | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = Array.isArray(err.meta?.target) ? (err.meta?.target as string[]).join(', ') : 'value';
      return `Already exists (${fields}). Use a different value or edit the existing record.`;
    }
    if (err.code === 'P2003') {
      return 'Related record is missing or still in use. Check tender / vehicle / driver links.';
    }
    if (err.code === 'P2025') {
      return 'Record not found. It may have already been deleted.';
    }
  }
  return null;
}
