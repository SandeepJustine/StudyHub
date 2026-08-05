import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import { PhysicsEngine } from '@/services/lab/PhysicsEngine';

const physicsEngine = new PhysicsEngine();

export class LabService {
  /**
   * Get all available experiment templates/rules.
   */
  getExperimentTemplates() {
    return physicsEngine.getAllRules();
  }

  /**
   * Create a new virtual lab experiment for a course.
   */
  async createLab(instructorId: string, data: {
    courseId: string;
    moduleId: string;
    title: string;
    description: string;
    templateId: string;
  }) {
    // Verify instructor owns the course
    const module = await prisma.courseModule.findUnique({
      where: { id: data.moduleId },
      include: { course: true },
    });

    if (!module || module.course.instructorId !== instructorId) {
      throw new AppError('Not authorized to add a lab to this module', 'FORBIDDEN', 403);
    }

    const template = physicsEngine.getRule(data.templateId);
    if (!template) {
      throw new NotFoundError('Experiment template not found');
    }

    const lab = await prisma.virtualLab.create({
      data: {
        courseId: data.courseId,
        moduleId: data.moduleId,
        title: data.title,
        description: data.description,
        templateId: data.templateId,
        // Initial state can be pre-populated based on the template if needed
        labState: {},
      },
    });

    return lab;
  }

  /**
   * Get all labs created by an instructor.
   */
  async getInstructorLabs(instructorId: string) {
    const labs = await prisma.virtualLab.findMany({
      where: {
        course: {
          instructorId: instructorId,
        },
      },
      include: {
        course: {
          select: { title: true },
        },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return labs;
  }

  /**
   * Get a single lab by its ID.
   */
  async getLabById(labId: string) {
    const lab = await prisma.virtualLab.findUnique({
      where: { id: labId },
      include: {
        attempts: {
          orderBy: { completedAt: 'desc' },
          include: { student: { include: { user: true } } },
        },
      },
    });

    if (!lab) throw new NotFoundError('Virtual Lab');
    return lab;
  }
}

export const labService = new LabService();