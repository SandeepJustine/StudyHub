// src/lib/prisma.ts
// Re-export the Prisma client singleton so that all modules importing
// from '@/lib/prisma' resolve correctly.
// Supports both default and named imports.
import prisma from './utils/prisma';
export default prisma;
export { prisma };
