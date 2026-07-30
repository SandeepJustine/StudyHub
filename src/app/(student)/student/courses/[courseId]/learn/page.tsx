// Student course learning page with full content rendering and quiz integration.
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import ContentViewer from './content-viewer';

export default async function CourseLearningPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ module?: string; quiz?: string; attempt?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const { courseId } = await params;
  const { module: moduleId } = await searchParams;

  // Get student profile
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!student) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center">
        <p>Student profile not found.</p>
      </div>
    );
  }

  // Check enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, courseId },
  });

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy mb-2">Not Enrolled</h2>
          <p className="text-grey-dark mb-4">You need to enroll in this course to access its content.</p>
          <a href={`/student/courses/${courseId}`} className="text-red hover:underline">
            View Course Details
          </a>
        </div>
      </div>
    );
  }

  // Get course with modules and quizzes
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
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
                },
              },
            },
          },
        },
      },
      instructor: {
        include: {
          user: {
            select: { fullName: true, avatar: true },
          },
        },
      },
    },
  });

  if (!course) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy mb-2">Course Not Found</h2>
          <p className="text-grey-dark mb-4">The course you are looking for does not exist.</p>
          <a href="/student/courses" className="text-red hover:underline">
            Browse Courses
          </a>
        </div>
      </div>
    );
  }

  // Determine current module
  let currentModule = moduleId
    ? course.modules.find(m => m.id === moduleId)
    : course.modules[0];

  if (!currentModule && course.modules.length > 0) {
    currentModule = course.modules[0];
  }

  // Get module progress
  const moduleProgress = await prisma.moduleProgress.findUnique({
    where: {
      enrollmentId_moduleId: {
        enrollmentId: enrollment.id,
        moduleId: currentModule?.id || '',
      },
    },
  });

  // Build content for the renderer
  let moduleContent: any = null;
  if (currentModule) {
    const contentType = currentModule.contentType as any;

    if (contentType === 'QUIZ' && currentModule.quiz) {
      moduleContent = {
        type: 'QUIZ',
        quizId: currentModule.quiz.id,
        title: currentModule.quiz.title,
        timeLimit: currentModule.quiz.timeLimit,
        passingScore: currentModule.quiz.passingScore,
        questions: currentModule.quiz.questions,
        courseId: course.id,
      };
    } else if (contentType === 'VIDEO') {
      moduleContent = {
        type: 'VIDEO',
        url: currentModule.contentUrl,
        provider: 'DIRECT',
        duration: currentModule.duration || 0,
        thumbnail: currentModule.thumbnailUrl,
      };
    } else if (contentType === 'AUDIO') {
      moduleContent = {
        type: 'AUDIO',
        url: currentModule.contentUrl,
        provider: 'DIRECT',
        duration: currentModule.duration || 0,
      };
    } else if (contentType === 'TEXT') {
      const contentData = currentModule.contentData;
      let textContent = '';
      try {
        const parsed = typeof contentData === 'string' ? JSON.parse(contentData) : contentData;
        textContent = parsed?.content || parsed || currentModule.contentUrl || '';
      } catch {
        textContent = currentModule.contentUrl || '';
      }
      moduleContent = {
        type: 'TEXT',
        format: 'HTML',
        content: textContent,
        estimatedReadTime: Math.ceil(textContent.replace(/<[^>]*>/g, '').split(/\s+/).length / 200),
      };
    } else if (contentType === 'PDF') {
      moduleContent = {
        type: 'PDF',
        url: currentModule.contentUrl,
        downloadUrl: currentModule.contentUrl,
      };
    } else if (contentType === 'SLIDES') {
      moduleContent = {
        type: 'SLIDES',
        url: currentModule.contentUrl,
        embedCode: currentModule.embedCode,
      };
    } else if (contentType === 'LINK') {
      moduleContent = {
        type: 'LINK',
        url: currentModule.contentUrl,
        title: currentModule.title,
        isExternal: true,
      };
    } else if (contentType === 'EMBED') {
      moduleContent = {
        type: 'EMBED',
        embedCode: currentModule.embedCode || currentModule.contentUrl,
        isResponsive: true,
      };
    }
  }

  return (
    <ContentViewer
      course={course}
      currentModule={currentModule}
      moduleProgress={moduleProgress}
      moduleContent={moduleContent}
      enrollmentId={enrollment.id}
      courseId={courseId}
    />
  );
}
