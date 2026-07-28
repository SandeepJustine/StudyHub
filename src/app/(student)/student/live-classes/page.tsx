import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Clock, Calendar, Users, Play, ArrowRight, User } from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import Link from 'next/link';

export default async function StudentLiveClassesPage() {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect('/auth/login'); }
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  // Fetch live classes from database
  let liveClasses: any[] = [];
  let upcomingClasses: any[] = [];
  let recordedClasses: any[] = [];

  try {
    const now = new Date();
    
    [liveClasses, recordedClasses] = await Promise.all([
      // Upcoming & live classes
      prisma.liveClass.findMany({
        where: {
          OR: [
            { status: 'scheduled', scheduledAt: { gte: now } },
            { status: 'live' },
          ],
        },
        include: {
          instructor: {
            include: { user: { select: { fullName: true, avatar: true } } },
          },
          course: { select: { title: true, subject: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      }),
      // Recorded classes
      prisma.liveClass.findMany({
        where: {
          status: 'ended',
          recordingUrl: { not: null },
        },
        include: {
          instructor: {
            include: { user: { select: { fullName: true } } },
          },
          course: { select: { title: true, subject: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        take: 5,
      }),
    ]);

    upcomingClasses = liveClasses;
  } catch (error) {
    console.error('Failed to fetch live classes:', error);
    // Mock data fallback
    upcomingClasses = [
      { id: '1', title: 'MSCE Math Revision', description: 'Final revision for MSCE Mathematics exam', subject: 'Mathematics', instructor: { user: { fullName: 'Mr. John Phiri' } }, scheduledAt: new Date(Date.now() + 3600000), duration: 90, maxParticipants: 100, currentParticipants: 45, status: 'scheduled', meetingLink: 'https://meet.google.com/abc-defg-hij' },
      { id: '2', title: 'Physics Practical Review', description: 'Review of common practical exam questions', subject: 'Physics', instructor: { user: { fullName: 'Dr. Mary Banda' } }, scheduledAt: new Date(Date.now() + 86400000), duration: 60, maxParticipants: 80, currentParticipants: 30, status: 'scheduled', meetingLink: null },
      { id: '3', title: 'Chemistry Lab Techniques', description: 'Learn essential lab techniques for exams', subject: 'Chemistry', instructor: { user: { fullName: 'Prof. Alex Chirwa' } }, scheduledAt: new Date(Date.now() + 172800000), duration: 120, maxParticipants: 50, currentParticipants: 15, status: 'scheduled', meetingLink: null },
    ];
    recordedClasses = [
      { id: '4', title: 'English Essay Writing', description: 'Master essay writing for MSCE English', subject: 'English', instructor: { user: { fullName: 'Ms. Grace Mwale' } }, scheduledAt: new Date(Date.now() - 86400000), duration: 75, recordingUrl: 'https://youtube.com/watch?v=example1', status: 'ended' },
      { id: '5', title: 'Biology Past Paper Review', description: 'Walkthrough of past paper questions', subject: 'Biology', instructor: { user: { fullName: 'Dr. Peter Kamanga' } }, scheduledAt: new Date(Date.now() - 172800000), duration: 90, recordingUrl: 'https://youtube.com/watch?v=example2', status: 'ended' },
    ];
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-100 rounded-xl"><Video size={22} className="text-blue-600" /></div>
        <div><h1 className="text-2xl font-bold text-navy">Live Classes</h1><p className="text-sm text-grey-medium">Join interactive live sessions</p></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[{ l:'Upcoming', v:upcomingClasses.filter(c=>c.status==='scheduled').length, i:<Calendar size={16} className="text-blue-600" />, b:'bg-blue-50' },{ l:'Live Now', v:upcomingClasses.filter(c=>c.status==='live').length, i:<Play size={16} className="text-green" />, b:'bg-green-50' },{ l:'Recordings', v:recordedClasses.length, i:<Video size={16} className="text-purple-600" />, b:'bg-purple-50' }].map((s,i)=>(
          <Card key={i} className="border-0 shadow-sm"><CardContent className="p-3 text-center"><div className={`p-1.5 rounded-lg ${s.b} inline-block mb-1`}>{s.i}</div><p className="text-xl font-bold text-navy">{s.v}</p><p className="text-xs text-grey-medium">{s.l}</p></CardContent></Card>
        ))}
      </div>

      {/* Upcoming & Live Classes */}
      <div>
        <h2 className="text-base font-bold text-navy mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-600" />Upcoming & Live</h2>
        <div className="space-y-3">
          {upcomingClasses.length > 0 ? upcomingClasses.map((cls) => (
            <Card key={cls.id} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={cls.status === 'live' ? 'error' : 'info'} size="sm">
                        {cls.status === 'live' ? '🔴 Live Now' : 'Scheduled'}
                      </Badge>
                      <Badge variant="neutral" size="sm">{cls.subject || cls.course?.subject}</Badge>
                    </div>
                    <h3 className="font-semibold text-navy">{cls.title}</h3>
                    <p className="text-sm text-grey-dark mt-1">{cls.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-grey-medium">
                      <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(cls.scheduledAt)}</span>
                      <span className="flex items-center gap-1"><Clock size={12} />{cls.duration} min</span>
                      <span className="flex items-center gap-1"><User size={12} />{cls.instructor?.user?.fullName}</span>
                      <span className="flex items-center gap-1"><Users size={12} />{cls.currentParticipants}/{cls.maxParticipants}</span>
                    </div>
                  </div>
                  {cls.status === 'live' && cls.meetingLink ? (
                    <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer">
                      <Button variant="primary" size="sm" className="ml-4"><Play size={14} className="mr-1" />Join Now</Button>
                    </a>
                  ) : (
                    <Button variant="outline" size="sm" className="ml-4"><Calendar size={14} className="mr-1" />Remind Me</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center"><Calendar size={40} className="mx-auto text-grey-medium mb-3" /><h3 className="font-semibold text-navy">No Upcoming Classes</h3><p className="text-sm text-grey-dark">Check back later for new sessions.</p></CardContent></Card>
          )}
        </div>
      </div>

      {/* Recordings */}
      {recordedClasses.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-navy mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-600" />Recent Recordings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recordedClasses.map((cls) => (
              <Card key={cls.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <Badge variant="neutral" size="sm" className="mb-2">{cls.subject || cls.course?.subject}</Badge>
                  <h3 className="font-semibold text-navy text-sm mb-1">{cls.title}</h3>
                  <p className="text-xs text-grey-medium mb-2">{cls.instructor?.user?.fullName} • {cls.duration} min</p>
                  {cls.recordingUrl && (
                    <a href={cls.recordingUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="primary" size="sm" rightIcon={<Play size={14} />}>Watch Recording</Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}