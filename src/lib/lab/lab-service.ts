import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import { PhysicsEngine } from '@/services/lab/PhysicsEngine';

const physicsEngine = new PhysicsEngine();

export class LabService {
  /**
   * Get all available experiment templates/rules (physics engine rules).
   */
  getExperimentTemplates() {
    return physicsEngine.getAllRules();
  }

  /**
   * Get a single physics rule/template by id.
   */
  getExperimentTemplate(templateId: string) {
    return physicsEngine.getRule(templateId);
  }

  /**
   * Get all experiments from the database.
   * Includes steps, course, and module assignment info.
   */
  async getAllExperiments() {
    const experiments = await prisma.experiment.findMany({
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        course: {
          select: { id: true, title: true },
        },
        module: {
          select: { id: true, title: true },
        },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return experiments;
  }

  /**
   * Get experiments assigned to a specific course.
   */
  async getExperimentsByCourse(courseId: string) {
    const experiments = await prisma.experiment.findMany({
      where: { courseId },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        module: {
          select: { id: true, title: true },
        },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return experiments;
  }

  /**
   * Get all courses owned by an instructor with their modules.
   * Used for the experiment assignment UI.
   */
  async getInstructorCoursesWithModules(instructorId: string) {
    const courses = await prisma.course.findMany({
      where: { instructorId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            contentType: true,
            order: true,
          },
        },
        _count: {
          select: { modules: true, enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses;
  }

  /**
   * Assign an experiment to a course and optionally a module.
   * Verifies the instructor owns the course.
   */
  async assignExperiment(
    experimentId: string,
    courseId: string,
    moduleId: string | null,
    instructorId: string,
  ) {
    // Verify the experiment exists
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
    });

    if (!experiment) {
      throw new NotFoundError('Experiment');
    }

    // Verify instructor owns the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      throw new NotFoundError('Course');
    }

    if (course.instructorId !== instructorId) {
      throw new AppError('Not authorized to assign experiments to this course', 'FORBIDDEN', 403);
    }

    // Verify module belongs to the course (if moduleId provided)
    if (moduleId) {
      const module = await prisma.courseModule.findUnique({
        where: { id: moduleId },
        select: { courseId: true },
      });

      if (!module || module.courseId !== courseId) {
        throw new AppError('Module does not belong to this course', 'FORBIDDEN', 403);
      }
    }

    return prisma.experiment.update({
      where: { id: experimentId },
      data: {
        courseId,
        moduleId,
      },
      include: {
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Unassign an experiment from its course/module.
   * Verifies the instructor owns the course the experiment is assigned to.
   */
  async unassignExperiment(experimentId: string, instructorId: string) {
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        course: { select: { instructorId: true } },
      },
    });

    if (!experiment) {
      throw new NotFoundError('Experiment');
    }

    if (experiment.course && experiment.course.instructorId !== instructorId) {
      throw new AppError('Not authorized to unassign this experiment', 'FORBIDDEN', 403);
    }

    return prisma.experiment.update({
      where: { id: experimentId },
      data: {
        courseId: null,
        moduleId: null,
      },
    });
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
        module: {
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
        course: { select: { id: true, title: true } },
        module: { select: { id: true, title: true } },
        attempts: {
          orderBy: { completedAt: 'desc' },
          include: { student: { include: { user: true } } },
        },
      },
    });

    if (!lab) throw new NotFoundError('Virtual Lab');
    return lab;
  }

  /**
   * Get all published experiments available to a student.
   * Returns experiments with their course/module assignment info,
   * and marks which ones are assigned to the student's enrolled courses.
   */
  async getStudentExperiments(studentId: string) {
    // Get the student's enrolled course IDs
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      select: { courseId: true },
    });

    const enrolledCourseIds = enrollments.map((e) => e.courseId);

    // Fetch all published experiments with steps, course, and module info
    const experiments = await prisma.experiment.findMany({
      where: { status: 'published' },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        course: {
          select: { id: true, title: true, subject: true },
        },
        module: {
          select: { id: true, title: true },
        },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mark which experiments are assigned to the student's enrolled courses
    const enrichedExperiments = experiments.map((exp) => ({
      ...exp,
      isAssignedToEnrolledCourse: exp.courseId ? enrolledCourseIds.includes(exp.courseId) : false,
    }));

    return {
      experiments: enrichedExperiments,
      enrolledCourseIds,
    };
  }

  /**
   * Get a single experiment by ID for a student to run.
   * Verifies the experiment is published and either assigned to one of
   * the student's enrolled courses or is a general published experiment.
   */
  async getStudentExperiment(studentId: string, experimentId: string) {
    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        course: {
          select: { id: true, title: true, subject: true },
        },
        module: {
          select: { id: true, title: true },
        },
      },
    });

    if (!experiment) {
      throw new NotFoundError('Experiment');
    }

    if (experiment.status !== 'published') {
      throw new AppError('Experiment is not available', 'NOT_FOUND', 404);
    }

    // Check if the student is enrolled in the course this experiment is assigned to
    let isAssignedToEnrolledCourse = false;
    if (experiment.courseId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId,
          courseId: experiment.courseId,
        },
      });
      isAssignedToEnrolledCourse = !!enrollment;
    }

    return {
      ...experiment,
      isAssignedToEnrolledCourse,
    };
  }
}

export const labService = new LabService();
