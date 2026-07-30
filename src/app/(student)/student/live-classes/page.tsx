import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import prisma from '@/lib/utils/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { 
  Video, Clock, Calendar, Users, Play, User, Monitor, ExternalLink 
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import Link from 'next/link';
import { RecordingPlayer } from '@/components/live-classes/recording-player';

export const dynamic = 'force-dynamic';

export default async function StudentLiveClassesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/login');
  if (session.user.role !== 'STUDENT') redirect(`/${session.user.role.toLowerCase()}/dashboard`);

  // Fetch from database
  let liveNow: any[] = [];
  let scheduled: any[] = [];
  let recorded: any[] = [];

  try {
    const now = new Date();
    
    const allClasses = await prisma.liveClass.findMany({
      include: {
        instructor: {
          include: { user: { select: { fullName: true, avatar: true } } },
        },
        course: { select: { title: true, subject: true } },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 20,
    });

    liveNow = allClasses.filter(c => c.status === 'live');
    scheduled = allClasses.filter(c => c.status === 'scheduled' && c.scheduledAt >= now);
    recorded = allClasses.filter(c => c.status === 'ended' && c.recordingUrl);
  } catch (error) {
    console.error('Failed to fetch live classes:', error);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-100 rounded-xl"><Video size={22} className="text-blue-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-navy">Live Classes</h1>
          <p className="text-sm text-grey-medium">Join interactive live sessions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Live Now', v: liveNow.length, icon: <Play size={16} className="text-green" />, bg: 'bg-green-50', pulse: true },
          { l: 'Upcoming', v: scheduled.length, icon: <Calendar size={16} className="text-blue-600" />, bg: 'bg-blue-50' },
          { l: 'Recordings', v: recorded.length, icon: <Video size={16} className="text-purple-600" />, bg: 'bg-purple-50' },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <div className={`p-1.5 rounded-lg ${s.bg} inline-block mb-1 relative`}>
                {s.icon}
                {s.pulse && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red rounded-full animate-pulse" />}
              </div>
              <p className="text-xl font-bold text-navy">{s.v}</p>
              <p className="text-xs text-grey-medium">{s.l}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Now - Show first */}
      {liveNow.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-navy mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red animate-pulse" />
            Live Now
          </h2>
          <div className="space-y-3">
            {liveNow.map((cls) => (
              <Card key={cls.id} className="border-0 shadow-sm border-l-4 border-l-red">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="error" size="sm">🔴 LIVE</Badge>
                        <Badge variant="neutral" size="sm">{cls.subject || cls.course?.subject}</Badge>
                      </div>
                      <h3 className="font-semibold text-navy">{cls.title}</h3>
                      <p className="text-sm text-grey-dark mt-1">{cls.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-grey-medium">
                        <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(cls.scheduledAt)}</span>
                        <span className="flex items-center gap-1"><Clock size={12} />{cls.duration} min</span>
                        <span className="flex items-center gap-1"><User size={12} />{cls.instructor?.user?.fullName}</span>
                        <span className="flex items-center gap-1"><Users size={12} />{cls.currentParticipants || 0}/{cls.maxParticipants || 100}</span>
                      </div>
                    </div>
                    <Link href={`/student/live-classes/${cls.id}/join`}>
                      <Button variant="primary" size="sm" className="ml-4 bg-red hover:bg-red-700">
                        <Play size={14} className="mr-1" /> Join Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Classes */}
      <div>
        <h2 className="text-base font-bold text-navy mb-3 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Upcoming Classes ({scheduled.length})
        </h2>
        <div className="space-y-3">
          {scheduled.length > 0 ? scheduled.map((cls) => (
            <Card key={cls.id} className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="info" size="sm">Scheduled</Badge>
                      <Badge variant="neutral" size="sm">{cls.subject || cls.course?.subject}</Badge>
                    </div>
                    <h3 className="font-semibold text-navy">{cls.title}</h3>
                    <p className="text-sm text-grey-dark mt-1">{cls.description || 'No description'}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-grey-medium">
                      <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(cls.scheduledAt)}</span>
                      <span className="flex items-center gap-1"><Clock size={12} />{cls.duration} min</span>
                      <span className="flex items-center gap-1"><User size={12} />{cls.instructor?.user?.fullName}</span>
                      <span className="flex items-center gap-1"><Users size={12} />{cls.currentParticipants || 0}/{cls.maxParticipants || 100}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Link href={`/student/live-classes/${cls.id}`}>
                      <Button variant="outline" size="sm"><Eye size={14} className="mr-1" />Details</Button>
                    </Link>
                    <Button variant="ghost" size="sm" disabled>
                      <Calendar size={14} className="mr-1" /> Starts {formatDate(cls.scheduledAt)}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <Calendar size={40} className="mx-auto text-grey-medium mb-3" />
                <h3 className="font-semibold text-navy">No Upcoming Classes</h3>
                <p className="text-sm text-grey-dark">Check back later for new sessions.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recordings with Inline Player */}
      {recorded.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-navy mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-600" />
            Recent Recordings ({recorded.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recorded.map((cls) => (
              <RecordingPlayer
                key={cls.id}
                id={cls.id}
                title={cls.title}
                subject={cls.subject || cls.course?.subject}
                instructor={cls.instructor?.user?.fullName}
                duration={cls.duration}
                recordingUrl={cls.recordingUrl || ''}
                scheduledAt={cls.scheduledAt}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Missing import
import { Eye } from 'lucide-react';