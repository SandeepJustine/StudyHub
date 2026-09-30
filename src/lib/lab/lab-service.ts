import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError } from '@/lib/utils/errors';
import { PhysicsEngine } from '@/services/lab/PhysicsEngine';
import { SUBJECTS } from '@/utils/constants';

const physicsEngine = new PhysicsEngine();

/**
 * Subjects an experiment may be assigned to. Kept separate from
 * `Experiment.subject`, which selects the lab simulator to run and therefore
 * must never be repurposed as a teaching-subject tag.
 */
const ASSIGNABLE_SUBJECTS: string[] = [...SUBJECTS];

function normaliseSubject(subject: string): string {
  const match = ASSIGNABLE_SUBJECTS.find((s) => s.toLowerCase() === String(subject || '').trim().toLowerCase());

  if (!match) {
    throw new AppError(
      `Unknown subject "${subject}". Valid subjects: ${ASSIGNABLE_SUBJECTS.join(', ')}`,
      'INVALID_SUBJECT',
      400,
    );
  }

  return match;
}

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
   * Subjects an instructor can assign experiments to.
   */
  getAssignableSubjects(): string[] {
    return ASSIGNABLE_SUBJECTS;
  }

  /**
   * An instructor's subject → experiment assignments, grouped by subject.
   * Includes the experiment details needed to render the assignment board.
   */
  async getSubjectAssignmentBoard(instructorId: string) {
    const assignments = await prisma.experimentSubjectAssignment.findMany({
      where: { instructorId },
      include: {
        experiment: {
          select: {
            id: true,
            title: true,
            subject: true,
            difficulty: true,
            description: true,
            duration: true,
            xpReward: true,
            status: true,
            _count: { select: { steps: true, attempts: true } },
          },
        },
      },
      orderBy: [{ subject: 'asc' }, { createdAt: 'desc' }],
    });

    const grouped = new Map<string, typeof assignments>();

    for (const assignment of assignments) {
      const list = grouped.get(assignment.subject) ?? [];
      list.push(assignment);
      grouped.set(assignment.subject, list);
    }

    const subjects = ASSIGNABLE_SUBJECTS.map((subject) => ({
      subject,
      count: grouped.get(subject)?.length ?? 0,
    }));

    // Include any subject already stored that is no longer in the canonical list,
    // so an instructor never silently loses sight of their existing assignments.
    for (const subject of grouped.keys()) {
      if (!subjects.some((s) => s.subject === subject)) {
        subjects.push({ subject, count: grouped.get(subject)!.length });
      }
    }

    return {
      subjects,
      assignments: assignments.map((a) => ({
        id: a.id,
        subject: a.subject,
        createdAt: a.createdAt,
        experiment: a.experiment,
      })),
    };
  }

  /**
   * Assign an existing experiment to a teaching subject.
   * Idempotent: assigning the same experiment to the same subject twice is a no-op.
   */
  async assignExperimentToSubject(experimentId: string, subject: string, instructorId: string) {
    const canonicalSubject = normaliseSubject(subject);

    const experiment = await prisma.experiment.findUnique({
      where: { id: experimentId },
      select: { id: true, title: true, status: true },
    });

    if (!experiment) {
      throw new NotFoundError('Experiment');
    }

    const assignment = await prisma.experimentSubjectAssignment.upsert({
      where: {
        experimentId_subject_instructorId: {
          experimentId,
          subject: canonicalSubject,
          instructorId,
        },
      },
      create: { experimentId, subject: canonicalSubject, instructorId },
      update: {},
      include: {
        experiment: {
          select: {
            id: true,
            title: true,
            subject: true,
            difficulty: true,
            description: true,
            duration: true,
            xpReward: true,
            status: true,
            _count: { select: { steps: true, attempts: true } },
          },
        },
      },
    });

    return assignment;
  }

  /**
   * Remove one of the instructor's subject assignments.
   * Assignments belonging to other instructors are never touched.
   */
  async unassignExperimentFromSubject(assignmentId: string, instructorId: string) {
    const assignment = await prisma.experimentSubjectAssignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, instructorId: true },
    });

    if (!assignment) {
      throw new NotFoundError('Subject assignment');
    }

    if (assignment.instructorId !== instructorId) {
      throw new AppError('Not authorized to modify this subject assignment', 'FORBIDDEN', 403);
    }

    await prisma.experimentSubjectAssignment.delete({ where: { id: assignmentId } });

    return true;
  }

  /**
   * Published experiments an instructor can still assign: everything not yet
   * assigned to the given subject by this instructor.
   */
  async getAssignableExperiments(instructorId: string, subject?: string) {
    const canonicalSubject = subject ? normaliseSubject(subject) : undefined;

    const existing = await prisma.experimentSubjectAssignment.findMany({
      where: {
        instructorId,
        ...(canonicalSubject ? { subject: canonicalSubject } : {}),
      },
      select: { experimentId: true },
    });

    const assignedIds = new Set(existing.map((a) => a.experimentId));

    const experiments = await prisma.experiment.findMany({
      where: { status: 'published' },
      include: {
        _count: { select: { steps: true, attempts: true } },
      },
      orderBy: { title: 'asc' },
    });

    return experiments.filter((exp) => !assignedIds.has(exp.id));
  }

  /**
   * Student-facing read: published experiments available under a subject,
   * either because an instructor assigned them there or because the
   * experiment's own lab subject matches.
   */
  async getExperimentsForSubject(subject: string) {
    const canonicalSubject = normaliseSubject(subject);

    return prisma.experiment.findMany({
      where: {
        status: 'published',
        OR: [
          { subjectAssignments: { some: { subject: canonicalSubject } } },
          { subject: { equals: canonicalSubject, mode: 'insensitive' } },
        ],
      },
      include: {
        steps: { orderBy: { order: 'asc' } },
        _count: { select: { steps: true, attempts: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  /**
   * Student-facing read: which subjects have experiments, and how many.
   */
  async getLabSubjectCatalog() {
    const assigned = await prisma.experimentSubjectAssignment.groupBy({
      by: ['subject'],
      where: { subject: { in: ASSIGNABLE_SUBJECTS } },
      _count: { subject: true },
    });

    const counts = new Map(assigned.map((a) => [a.subject, a._count.subject]));

    const intrinsic = await prisma.experiment.groupBy({
      by: ['subject'],
      where: { status: 'published' },
      _count: { subject: true },
    });

    return ASSIGNABLE_SUBJECTS.map((subject) => ({
      subject,
      experimentCount:
        (counts.get(subject) ?? 0) +
        (intrinsic.find((e) => e.subject.toLowerCase() === subject.toLowerCase())?._count.subject ?? 0),
    }));
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
