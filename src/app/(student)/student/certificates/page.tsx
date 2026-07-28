import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Download, Eye, Shield, Star } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StudentCertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  const student = await prisma.student.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!student) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Award size={48} className="mx-auto text-grey-medium mb-4" />
          <h2 className="text-xl font-bold text-navy mb-2">Student Profile Not Found</h2>
          <p className="text-grey-dark">Please contact support.</p>
        </div>
      </div>
    );
  }

  // Fetch certificates - use enrollmentId and examAttemptId instead of relations
  const certificates = await prisma.certificate.findMany({
    where: { studentId: student.id },
    orderBy: { issuedAt: 'desc' },
  });

  // Fetch related enrollment and exam data separately
  const enrollmentIds = certificates.filter(c => c.enrollmentId).map(c => c.enrollmentId!);
  const examAttemptIds = certificates.filter(c => c.examAttemptId).map(c => c.examAttemptId!);

  const [enrollments, examAttempts] = await Promise.all([
    enrollmentIds.length > 0
      ? prisma.enrollment.findMany({
          where: { id: { in: enrollmentIds } },
          include: { course: { select: { title: true, subject: true } } },
        })
      : [],
    examAttemptIds.length > 0
      ? prisma.examAttempt.findMany({
          where: { id: { in: examAttemptIds } },
          include: { quiz: { select: { title: true } } },
        })
      : [],
  ]);

  // Create lookup maps
  const enrollmentMap = new Map(enrollments.map(e => [e.id, e]));
  const examMap = new Map(examAttempts.map(e => [e.id, e]));

  const digitalCerts = certificates.filter(c => c.type === 'DIGITAL');
  const printedCerts = certificates.filter(c => c.type === 'PRINTED');
  const verifiedCerts = certificates.filter(c => c.type === 'VERIFIED');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-yellow-100 rounded-xl"><Award size={22} className="text-yellow-600" /></div>
        <div><h1 className="text-2xl font-bold text-navy">My Certificates</h1><p className="text-sm text-grey-medium">Your earned achievements</p></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l:'Total', v:certificates.length, i:<Award size={16} className="text-navy" />, b:'bg-navy/10' },
          { l:'Digital', v:digitalCerts.length, i:<Download size={16} className="text-green" />, b:'bg-green-50' },
          { l:'Printed', v:printedCerts.length, i:<Star size={16} className="text-blue-600" />, b:'bg-blue-50' },
          { l:'Verified', v:verifiedCerts.length, i:<Shield size={16} className="text-purple-600" />, b:'bg-purple-50' },
        ].map((s,i) => (
          <Card key={i} className="border-0 shadow-sm"><CardContent className="p-3 text-center"><div className={`p-1.5 rounded-lg ${s.b} inline-block mb-1`}>{s.i}</div><p className="text-xl font-bold text-navy">{s.v}</p><p className="text-xs text-grey-medium">{s.l}</p></CardContent></Card>
        ))}
      </div>

      {/* Certificates Grid */}
      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => {
            const enrollment = cert.enrollmentId ? enrollmentMap.get(cert.enrollmentId) : null;
            const exam = cert.examAttemptId ? examMap.get(cert.examAttemptId) : null;

            return (
              <Card key={cert.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex justify-between mb-3">
                    <Badge variant={cert.type === 'VERIFIED' ? 'success' : cert.type === 'PRINTED' ? 'info' : 'neutral'} size="sm">
                      {cert.type}
                    </Badge>
                    <span className="text-xs text-grey-medium">{formatDate(cert.issuedAt)}</span>
                  </div>

                  <div className="flex justify-center mb-3">
                    <div className={`p-4 rounded-full ${
                      cert.type === 'VERIFIED' ? 'bg-green-50' : cert.type === 'PRINTED' ? 'bg-blue-50' : 'bg-navy/5'
                    }`}>
                      {cert.type === 'VERIFIED' ? <Shield size={36} className="text-green" /> :
                       cert.type === 'PRINTED' ? <Star size={36} className="text-blue-600" /> :
                       <Award size={36} className="text-navy" />}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-navy text-center mb-2">{cert.title}</h3>
                  {cert.description && <p className="text-xs text-grey-dark text-center mb-3">{cert.description}</p>}

                  <div className="bg-grey-light/50 rounded-lg p-3 mb-3 space-y-1 text-xs">
                    {enrollment && (
                      <p><strong>Course:</strong> {enrollment.course.title} ({enrollment.course.subject})</p>
                    )}
                    {exam && (
                      <p><strong>Exam:</strong> {exam.quiz.title}</p>
                    )}
                    <p className="text-grey-medium">ID: {cert.verificationId}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" fullWidth><Eye size={14} className="mr-1" /> View</Button>
                    <Button variant="primary" size="sm" fullWidth><Download size={14} className="mr-1" /> Download</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Award size={64} className="mx-auto text-grey-medium mb-4" />
            <h2 className="text-2xl font-bold text-navy mb-2">No Certificates Yet</h2>
            <p className="text-grey-dark mb-6">Complete courses and pass exams to earn certificates.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/student/courses"><Button variant="primary">Browse Courses</Button></Link>
              <Link href="/student/exams"><Button variant="outline">Take an Exam</Button></Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}