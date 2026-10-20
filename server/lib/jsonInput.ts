import { Prisma } from '../generated/prisma';

/** Convert app values into Prisma JSON input (null → JsonNull). */
export function asJsonInput(
  value: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value as Prisma.InputJsonValue;
}
