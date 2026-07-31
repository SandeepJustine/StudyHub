import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';

export class TrainingService {
  /**
   * Create corporate training package
   */
  async createTrainingPackage(clientId: string, data: {
    title: string;
    description?: string;
    courses: Array<{ courseId: string; quantity: number }>;
    startDate: Date;
    endDate: Date;
  }) {
    // Calculate total
    let totalAmount = 0;
    const courseDetails = [];

    for (const item of data.courses) {
      const course = await prisma.course.findUnique({
        where: { id: item.courseId },
      });

      if (!course) throw new NotFoundError(`Course ${item.courseId}`);
      
      const itemTotal = course.price * item.quantity;
      totalAmount += itemTotal;
      
      courseDetails.push({
        courseId: course.id,
        title: course.title,
        price: course.price,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    // Apply bulk discount
    let discount = 0;
    if (data.courses.length >= 10) discount = 0.15; // 15% for 10+ courses
    else if (data.courses.length >= 5) discount = 0.10; // 10% for 5+ courses
    
    const finalAmount = Math.floor(totalAmount * (1 - discount));

    // Create contract
    const contract = await prisma.corporateContract.create({
      data: {
        clientId,
        title: data.title,
        description: data.description,
        courses: courseDetails,
        totalAmount: finalAmount,
        status: 'draft',
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    return contract;
  }

  /**
   * Activate training contract (after payment)
   */
  async activateContract(contractId: string, clientId: string) {
    const contract = await prisma.corporateContract.findUnique({
      where: { id: contractId },
    });

    if (!contract) throw new NotFoundError('Contract');
    if (contract.clientId !== clientId) {
      throw new AppError('Not authorized', 'FORBIDDEN', 403);
    }

    return prisma.corporateContract.update({
      where: { id: contractId },
      data: {
        status: 'active',
      },
    });
  }

  /**
   * Get client's contracts
   */
  async getClientContracts(clientId: string) {
    return prisma.corporateContract.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }
}