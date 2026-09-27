import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development (Next.js hot reload)
// and prevent connection exhaustion across serverless or edge re-evaluations.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

// Cache on globalThis in all non-production environments to avoid multiple pools
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Convenience alias
export const prisma = db;

/**
 * Cleanly disconnect database client during teardowns or script exits.
 */
export async function disconnectDb(): Promise<void> {
  await db.$disconnect();
}

