import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Sparkles, Check } from 'lucide-react';
import { AITutorClient } from './ai-tutor-client';

interface CourseWithModules {
  id: string;
  title: string;
  subject: string;
  modules: Array<{
    id: string;
    title: string;
    contentType: string;
    quiz?: {
      id: string;
      title: string;
    } | null;
  }>;
}

export default async function AITutorPage() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const student = await prisma.student.findFirst({
    where: { userId: session.user.id },
    select: { id: true, grade: true, examBoard: true, subjects: true },
  });

  if (!student) {
    return (
      <div className="min-h-screen bg-grey-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-navy mb-2">Student Profile Not Found</h2>
          <p className="text-grey-dark">Please contact support to set up your student profile.</p>
        </div>
      </div>
    );
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId: session.user.id, status: 'active' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, tier: true, status: true },
  });

  const isPremium =
    subscription?.tier === 'STUDENT_PREMIUM' ||
    subscription?.tier === 'STUDENT_ANNUAL';

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-grey-light p-6">
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-gradient-to-r from-navy to-navy-light rounded-2xl p-8 text-white text-center shadow-xl">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} className="text-yellow-300" />
            </div>
            <h1 className="text-2xl font-bold mb-2">AI Tutor</h1>
            <p className="text-slate-300 mb-6">
              Unlock personalized AI-powered tutoring to accelerate your learning.
              Get step-by-step explanations, practice problems, and instant feedback
              tailored to your grade and exam board.
            </p>
            <ul className="text-left text-sm text-slate-300 space-y-2 mb-8 max-w-md mx-auto">
              <li className="flex items-center gap-2">
                <Check size={16} className="text-green-400" />
                Personalized explanations for any subject
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-green-400" />
                Step-by-step problem solving
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-green-400" />
                Context-aware to your grade and exam board
              </li>
              <li className="flex items-center gap-2">
                <Check size={16} className="text-green-400" />
                Unlimited questions and follow-ups
              </li>
            </ul>
            <a href="/pricing">
              <button className="bg-red hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-md">
                Upgrade to Premium
              </button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              contentType: true,
              quiz: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const courses: CourseWithModules[] = enrollments.map((e) => ({
    id: e.course.id,
    title: e.course.title,
    subject: e.course.subject,
    modules: e.course.modules.map((m) => ({
      id: m.id,
      title: m.title,
      contentType: m.contentType,
      quiz: m.quiz || undefined,
    })),
  }));

  return (
    <AITutorClient
      student={{
        id: student.id,
        grade: student.grade,
        examBoard: student.examBoard,
        subjects: student.subjects,
      }}
      courses={courses}
    />
  );
}
