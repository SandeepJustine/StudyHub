import prisma from '@/lib/utils/prisma';
import { AppError, NotFoundError, ValidationError } from '@/lib/utils/errors';
import { CourseStatus as ContentStatus, ContentType, QuestionType } from '@/types/course';
import { featureGating } from '@/lib/billing/feature-gating';

export class CourseService {
  /**
   * Create a new course
   */
  async createCourse(instructorId: string, data: {
    title: string;
    description?: string;
    subject: string;
    examBoard?: string;
    grade?: string;
    price: number;
    thumbnail?: string;
    tags?: string[];
    language?: string;
    modules?: Array<{
      title: string;
      description?: string;
      contentType: ContentType;
      contentUrl?: string;
      duration?: number;
      isPreview?: boolean;
      order: number;
    }>;
  }) {
    // Check feature access
    //await featureGating.enforceAccess(instructorId, 'course:create');
    const instructorUser = await prisma.instructor.findUnique({ where: { id: instructorId }, select: { userId: true } });
     if (!instructorUser) throw new AppError('Instructor profile not found', 'NOT_FOUND', 404);
    await featureGating.enforceAccess(instructorUser.userId, 'course:create');

    // Validate price
    if (data.price < 0) {
      throw new ValidationError('Invalid price', {
        price: ['Price must be a positive number'],
      });
    }

    // Validate price range
    if (data.price > 50000) {
      throw new ValidationError('Price too high', {
        price: ['Maximum course price is MWK 50,000'],
      });
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        instructorId,
        title: data.title,
        description: data.description,
        subject: data.subject,
        examBoard: data.examBoard,
        grade: data.grade,
        price: data.price,
        thumbnail: data.thumbnail,
        tags: data.tags || [],
        language: data.language || 'en',
        status: 'DRAFT',
        modules: data.modules ? {
          create: data.modules.map(mod => ({
            title: mod.title,
            description: mod.description,
            contentType: mod.contentType,
            contentUrl: mod.contentUrl,
            duration: mod.duration,
            isPreview: mod.isPreview || false,
            isRequired: true,
            order: mod.order,
          })),
        } : undefined,
      },
      include: {
        modules: true,
        instructor: {
          include: { user: true },
        },
      },
    });

    // Update instructor course count
    await prisma.instructor.update({
      where: { id: instructorId },
      data: { coursesCount: { increment: 1 } },
    });

    return course;
  }

  /**
   * Update course details
   */
  async updateCourse(courseId: string, instructorId: string, data: {
    title?: string;
    description?: string;
    subject?: string;
    examBoard?: string;
    grade?: string;
    price?: number;
    thumbnail?: string;
    tags?: string[];
    status?: ContentStatus;
  }) {
    // Verify ownership
    const course = await this.getCourseById(courseId);
    if (course.instructorId !== instructorId) {
      throw new AppError('Not authorized to update this course', 'FORBIDDEN', 403);
    }

    // Can't update published courses without review
    if (course.status === 'APPROVED' && data.status) {
      throw new AppError(
        'Published courses require admin review for changes',
        'REQUIRES_REVIEW',
        400
      );
    }

    // Update course
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...data,
        updatedAt: new Date(),
        ...(data.status === 'APPROVED' && !course.publishedAt && {
          publishedAt: new Date(),
        }),
      },
      include: {
        modules: true,
        instructor: { include: { user: true } },
      },
    });

    return updated;
  }

  /**
   * Add module to course
   */
  async addModule(courseId: string, instructorId: string, data: {
    title: string;
    description?: string;
    contentType: ContentType;
    contentUrl?: string;
    contentData?: any;
    duration?: number;
    isPreview?: boolean;
    order?: number;
  }) {
    const course = await this.getCourseById(courseId);
    if (course.instructorId !== instructorId) {
      throw new AppError('Not authorized', 'FORBIDDEN', 403);
    }

    // Calculate order
    const maxOrder = await prisma.courseModule.aggregate({
      where: { courseId },
      _max: { order: true },
    });
    const order = data.order || (maxOrder._max.order || 0) + 1;

    const module = await prisma.courseModule.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        contentType: data.contentType,
        contentUrl: data.contentUrl,
        contentData: data.contentData,
        duration: data.duration,
        isPreview: data.isPreview || false,
        isRequired: true,
        order,
      },
    });

    // Update course duration
    await this.updateCourseDuration(courseId);

    return module;
  }

  /**
   * Add quiz to module
   */
  async addQuiz(moduleId: string, instructorId: string, data: {
    title: string;
    description?: string;
    timeLimit?: number;
    passingScore?: number;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
    questions: Array<{
      type: QuestionType;
      text: string;
      options?: Array<{ text: string; isCorrect: boolean }>;
      correctAnswer?: string;
      explanation?: string;
      points: number;
      order: number;
    }>;
  }) {
    const module = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module || module.course.instructorId !== instructorId) {
      throw new AppError('Not authorized', 'FORBIDDEN', 403);
    }

    // Calculate total points
    const totalPoints = data.questions.reduce((sum, q) => sum + q.points, 0);

    // Create quiz with questions
    const quiz = await prisma.quiz.create({
      data: {
        moduleId,
        title: data.title,
        description: data.description,
        timeLimit: data.timeLimit,
        passingScore: data.passingScore || 60,
        maxAttempts: data.maxAttempts || 3,
        shuffleQuestions: data.shuffleQuestions ?? true,
        questionsCount: data.questions.length,
        totalPoints,
        questions: {
          create: data.questions.map((q) => ({
            type: q.type,
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points,
            order: q.order,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return quiz;
  }

  /**
   * Get course by ID with full details
   */
  async getCourseById(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          include: { user: true },
        },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            quiz: {
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    type: true,
                    text: true,
                    options: true,
                    points: true,
                    order: true,
                    // Don't include correctAnswer/explanation for students
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError('Course');
    }

    return course;
  }

  /**
   * Search courses with filters
   */
  async searchCourses(params: {
    query?: string;
    subject?: string;
    examBoard?: string;
    grade?: string;
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    status?: ContentStatus;
    sortBy?: 'popularity' | 'rating' | 'price' | 'newest' | 'title';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const {
      query,
      subject,
      examBoard,
      grade,
      priceMin,
      priceMax,
      rating,
      status = 'APPROVED',
      sortBy = 'newest',
      sortOrder = 'desc',
      page = 1,
      limit = 12,
    } = params;

    // Build where clause
    const where: any = {
      status,
      ...(query && {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { subject: { contains: query, mode: 'insensitive' } },
        ],
      }),
      ...(subject && { subject }),
      ...(examBoard && { examBoard }),
      ...(grade && { grade }),
      ...(priceMin !== undefined && priceMax !== undefined && {
        price: { gte: priceMin, lte: priceMax },
      }),
      ...(rating && { rating: { gte: rating } }),
    };

    // Build order by
    const orderBy: any = {};
    switch (sortBy) {
      case 'popularity':
        orderBy.studentsCount = sortOrder;
        break;
      case 'rating':
        orderBy.rating = sortOrder;
        break;
      case 'price':
        orderBy.price = sortOrder;
        break;
      case 'title':
        orderBy.title = sortOrder;
        break;
      default:
        orderBy.createdAt = sortOrder;
    }

    // Execute query with pagination
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          instructor: {
            select: {
              id: true,
              userId: true,
              user: {
                select: {
                  fullName: true,
                  avatar: true,
                },
              },
              rating: true,
              studentsCount: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    // Determine which instructors are linked to institutions (school admins)
    const instructorUserIds = courses
      .map(c => c.instructor?.userId)
      .filter((id): id is string => !!id);

    const schoolAdminUsers = instructorUserIds.length > 0
      ? await prisma.schoolAdmin.findMany({
          where: { userId: { in: instructorUserIds } },
          select: { userId: true },
        })
      : [];

    const institutionInstructorIds = new Set(schoolAdminUsers.map(sa => sa.userId));

    // Enrich courses with institution flag
    const enrichedCourses = courses.map(course => ({
      ...course,
      isInstitutionCourse: course.instructor ? institutionInstructorIds.has(course.instructor.userId) : false,
    }));

    return {
      courses: enrichedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Get courses by instructor
   */
  async getInstructorCourses(instructorId: string, params?: {
    status?: ContentStatus;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 10 } = params || {};

    const where: any = {
      instructorId,
      ...(status && { status }),
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: {
              enrollments: true,
              reviews: true,
              modules: true,
            },
          },
        },
      }),
      prisma.course.count({ where }),
    ]);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete course (soft delete - archive)
   */
  async archiveCourse(courseId: string, instructorId: string) {
    const course = await this.getCourseById(courseId);
    if (course.instructorId !== instructorId) {
      throw new AppError('Not authorized', 'FORBIDDEN', 403);
    }

    return prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'ARCHIVED',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Submit course for review
   */
  async submitForReview(courseId: string, instructorId: string) {
    const course = await this.getCourseById(courseId);
    if (course.instructorId !== instructorId) {
      throw new AppError('Not authorized', 'FORBIDDEN', 403);
    }

    // Validate course has content
    if (course.modules.length === 0) {
      throw new ValidationError('Course must have at least one module', {
        modules: ['At least one module is required'],
      });
    }

    return prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'PENDING_REVIEW',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Admin: Review course
   */
  async reviewCourse(courseId: string, adminId: string, decision: {
    approved: boolean;
    feedback?: string;
  }) {
    const course = await this.getCourseById(courseId);

    if (decision.approved) {
      return prisma.course.update({
        where: { id: courseId },
        data: {
          status: 'APPROVED',
          publishedAt: course.publishedAt || new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      return prisma.course.update({
        where: { id: courseId },
        data: {
          status: 'REJECTED',
          updatedAt: new Date(),
          metadata: {
            ...(course as any).metadata,
            reviewFeedback: decision.feedback,
            reviewedBy: adminId,
            reviewedAt: new Date().toISOString(),
          },
        },
      });
    }
  }

  /**
   * Enroll student in course
   */
  async enrollStudent(studentId: string, courseId: string, paymentMethod?: string) {
    // Check if course exists and is approved
    const course = await this.getCourseById(courseId);
    if (course.status !== 'APPROVED') {
      throw new AppError('Course is not available for enrollment', 'COURSE_UNAVAILABLE', 400);
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
    });

    if (existing) {
      throw new AppError('Already enrolled in this course', 'ALREADY_ENROLLED', 409);
    }

    // Process payment if course is paid
    if (course.price > 0 && paymentMethod) {
      // Payment processing would be handled by PaymentService
      // For now, create enrollment directly
    }

    // Create enrollment
    const totalModules = course.modules.length;
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        totalModules,
        startedAt: new Date(),
      },
    });

    // Update course student count
    await prisma.course.update({
      where: { id: courseId },
      data: { studentsCount: { increment: 1 } },
    });

    // Update instructor student count
    await prisma.instructor.update({
      where: { id: course.instructorId },
      data: { studentsCount: { increment: 1 } },
    });

    return enrollment;
  }

  /**
   * Update enrollment progress
   */
  async updateProgress(enrollmentId: string, moduleId: string, completed: boolean) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: { include: { modules: true } } },
    });
    
    if (!enrollment) throw new NotFoundError('Enrollment');
    
    // Get current completed modules
    const completedModules = enrollment.completedModules || [];
    
    // Add or remove the module ID based on the completed flag
    if (completed && !completedModules.includes(moduleId)) {
      completedModules.push(moduleId);
    } else if (!completed && completedModules.includes(moduleId)) {
      const index = completedModules.indexOf(moduleId);
      completedModules.splice(index, 1);
    }
    
    // Calculate new progress
    const progress = (completedModules.length / enrollment.course.modules.length) * 100;
    
    // Update enrollment
    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        completedModules,
        progress: Math.min(100, Math.max(0, progress)),
        lastAccessedAt: new Date(),
        ...(progress >= 100 && !enrollment.completedAt && { completedAt: new Date() }),
      },
    });
    
    // Check for certificate eligibility
    if (updated.progress >= 100 && !updated.certificateId) {
      // Auto-generate certificate logic here
    }
    
    return updated;
  }


  /**
   * Add course review
   */
  async addReview(studentId: string, courseId: string, data: {
    rating: number;
    comment?: string;
    isAnonymous?: boolean;
  }) {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new ValidationError('Invalid rating', {
        rating: ['Rating must be between 1 and 5'],
      });
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
    });

    if (!enrollment) {
      throw new AppError('Must be enrolled to review', 'NOT_ENROLLED', 400);
    }

    // Check for existing review
    const existing = await prisma.courseReview.findUnique({
      where: {
        courseId_studentId: { courseId, studentId },
      },
    });

    if (existing) {
      throw new AppError('Already reviewed this course', 'ALREADY_REVIEWED', 409);
    }

    // Create review
    const review = await prisma.courseReview.create({
      data: {
        courseId,
        studentId,
        rating: data.rating,
        comment: data.comment,
        isAnonymous: data.isAnonymous || false,
      },
    });

    // Update course rating
    await this.updateCourseRating(courseId);

    return review;
  }

  /**
   * Update course average rating
   */
  private async updateCourseRating(courseId: string) {
    const stats = await prisma.courseReview.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.course.update({
      where: { id: courseId },
      data: {
        rating: stats._avg.rating || 0,
        reviewsCount: stats._count.rating,
      },
    });
  }

  /**
   * Update course total duration
   */
  private async updateCourseDuration(courseId: string) {
    const modules = await prisma.courseModule.findMany({
      where: { courseId },
      select: { duration: true },
    });

    const totalDuration = modules.reduce(
      (sum, mod) => sum + (mod.duration || 0),
      0
    );

    await prisma.course.update({
      where: { id: courseId },
      data: { duration: totalDuration },
    });
  }
}

export const courseService = new CourseService();