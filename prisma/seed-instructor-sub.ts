import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const instructors = await prisma.user.findMany({ where: { role: 'INSTRUCTOR' } });
  
  for (const user of instructors) {
    const existingSub = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'active' }
    });
    
    if (!existingSub) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          tier: 'INSTRUCTOR_FREE',
          cycle: 'MONTHLY',
          status: 'active',
          amount: 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          autoRenew: true,
        }
      });
      console.log('✅ Created INSTRUCTOR_FREE subscription for:', user.email);
    } else {
      console.log('✅ Already has subscription:', user.email, '-', existingSub.tier);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
