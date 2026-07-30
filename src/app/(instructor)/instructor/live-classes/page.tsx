import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Video, Plus, Calendar, Clock, Users, Play, Edit, Trash2, Copy } from 'lucide-react';
import { formatDateTime, formatDuration } from '@/utils/formatters';
import { instructorService } from '@/lib/instructor/instructor-service';
import prisma from '@/lib/utils/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InstructorLiveClassesPage({
  searchParams,
}: { searchParams: { status?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'INSTRUCTOR') {
    redirect('/auth/login');
  }

  const statusFilter = searchParams.status;

  let liveClasses: any[] = [];
  let error: string | null = null;

  try {
    const instructor = await instructorService.resolveByUserId(session.user.id);

    const where: any = { instructorId: instructor.id };
    if (statusFilter) where.status = statusFilter;

    liveClasses = await prisma.liveClass.findMany({
      where: where as any,
      include: {
        course: { select: { title: true, subject: true } },
      } as any,
      orderBy: { scheduledAt: statusFilter === 'ended' ? 'desc' : 'asc' },
    });
  } catch (e: any) {
    error = e.message || 'Failed to load live classes';
  }

  const statusOptions = [
    { value: '', label: 'All Classes' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'live', label: 'Live Now' },
    { value: 'ended', label: 'Ended' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="info" size="sm">Scheduled</Badge>;
      case 'live':
        return <Badge variant="success" size="sm">Live</Badge>;
      case 'ended':
        return <Badge variant="neutral" size="sm">Ended</Badge>;
      case 'cancelled':
        return <Badge variant="error" size="sm">Cancelled</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Live Classes</h1>
          <p className="text-sm text-grey-medium">Schedule and manage your live classes</p>
        </div>
        <Link href="/instructor/live-classes/schedule">
          <Button variant="primary" leftIcon={<Plus size={18} />}>
            Schedule New Class
          </Button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusOptions.map((opt) => (
          <Link
            key={opt.value}
            href={`/instructor/live-classes?status=${opt.value}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              (statusFilter || '') === opt.value
                ? 'bg-navy text-white'
                : 'bg-white text-grey-dark hover:bg-navy/5 border border-grey-light'
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {/* Live Now banner */}
      {liveClasses.some((c) => c.status === 'live') && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Video size={20} className="text-green animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-green">Class is Live Now</h3>
                <p className="text-sm text-green-800">
                  {liveClasses.find((c) => c.status === 'live')?.title || 'A live class is in progress'}
                </p>
              </div>
              <Link href={`/instructor/live-classes/${liveClasses.find((c) => c.status === 'live')?.id}/start`}>
                <Button variant="secondary" size="sm" leftIcon={<Play size={14} />}>
                  Join Class
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classes List */}
      {liveClasses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Video size={48} className="mx-auto text-grey-medium mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-2">No live classes found</h3>
            <p className="text-grey-medium mb-4">
              {statusFilter
                ? `No classes with status "${statusFilter}"`
                : 'You haven\'t scheduled any live classes yet.'}
            </p>
            <Link href="/instructor/live-classes/schedule">
              <Button variant="primary" leftIcon={<Plus size={18} />}>
                Schedule Your First Class
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {liveClasses.map((cls) => (
            <Card key={cls.id} hover>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-navy text-lg">{cls.title}</h3>
                      {getStatusBadge(cls.status)}
                    </div>

                    {cls.course && (
                      <p className="text-sm text-grey-medium mb-1">
                        Course: {cls.course.title} ({cls.course.subject})
                      </p>
                    )}

                    {cls.description && (
                      <p className="text-sm text-grey-dark mb-2 line-clamp-1">{cls.description}</p>
                    )}

                    <div className="flex items-center gap-6 text-sm text-grey-dark">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{formatDateTime(cls.scheduledAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatDuration(cls.duration)} duration</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>{cls.currentParticipants}/{cls.maxParticipants} participants</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {cls.status === 'live' && (
                      <Link href={`/instructor/live-classes/${cls.id}/start`}>
                        <Button variant="secondary" size="sm" leftIcon={<Play size={14} />}>
                          Start
                        </Button>
                      </Link>
                    )}
                    {cls.status === 'scheduled' && (
                      <Link href={`/instructor/live-classes/${cls.id}/start`}>
                        <Button variant="outline" size="sm">
                          Start Early
                        </Button>
                      </Link>
                    )}
                    {cls.recordingUrl && (
                      <Button variant="ghost" size="sm" leftIcon={<Copy size={14} />}>
                        Recording
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
