import { AITutorContextService } from '../ai-tutor-context';

jest.mock('@/lib/utils/prisma', () => ({
  student: {
    findFirst: jest.fn(),
  },
  course: {
    findUnique: jest.fn(),
  },
  courseModule: {
    findUnique: jest.fn(),
  },
  quiz: {
    findUnique: jest.fn(),
  },
  examAttempt: {
    findFirst: jest.fn(),
  },
}));

import prisma from '@/lib/utils/prisma';

describe('AITutorContextService', () => {
  let contextService: AITutorContextService;

  beforeEach(() => {
    contextService = new AITutorContextService();
    jest.clearAllMocks();
  });

  it('should build context with student data', async () => {
    (prisma.student.findFirst as jest.Mock).mockResolvedValue({
      id: 'student1',
      grade: 'Form 4',
      examBoard: 'MSCE',
      subjects: ['Mathematics', 'Physics'],
    });

    (prisma.examAttempt.findFirst as jest.Mock).mockResolvedValue(null);

    const context = await contextService.buildContext({
      studentId: 'student1',
      subject: 'Mathematics',
    });

    expect(context.studentId).toBe('student1');
    expect(context.grade).toBe('Form 4');
    expect(context.examBoard).toBe('MSCE');
    expect(context.subjects).toEqual(['Mathematics', 'Physics']);
  });

  it('should include course context when courseId is provided', async () => {
    (prisma.student.findFirst as jest.Mock).mockResolvedValue({
      id: 'student1',
      grade: 'Form 4',
      examBoard: 'MSCE',
      subjects: ['Mathematics'],
    });

    (prisma.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course1',
      title: 'Advanced Mathematics',
      subject: 'Mathematics',
    });

    (prisma.examAttempt.findFirst as jest.Mock).mockResolvedValue(null);

    const context = await contextService.buildContext({
      studentId: 'student1',
      courseId: 'course1',
    });

    expect(context.courseTitle).toBe('Advanced Mathematics');
    expect(prisma.course.findUnique).toHaveBeenCalledWith({
      where: { id: 'course1' },
      select: { id: true, title: true, subject: true },
    });
  });

  it('should include recent performance when available', async () => {
    (prisma.student.findFirst as jest.Mock).mockResolvedValue({
      id: 'student1',
      grade: 'Form 4',
      examBoard: 'MSCE',
      subjects: ['Mathematics'],
    });

    (prisma.examAttempt.findFirst as jest.Mock).mockResolvedValue({
      score: 85,
      passed: true,
    });

    const context = await contextService.buildContext({
      studentId: 'student1',
    });

    expect(context.recentPerformance?.score).toBe(85);
    expect(context.recentPerformance?.passed).toBe(true);
  });
});
