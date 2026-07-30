'use client';

import { useRouter } from 'next/navigation';
import { JitsiMeetingComponent } from '@/components/live-classes/jitsi-meeting';

interface LiveClassStarterProps {
  roomName: string;
  displayName: string;
  email: string;
  subject: string;
  classId: string;
}

export function LiveClassStarter({
  roomName,
  displayName,
  email,
  subject,
  classId,
}: LiveClassStarterProps) {
  const router = useRouter();

  const handleEnd = async () => {
    try {
      // Mark class as ended
      await fetch(`/api/live-classes/${classId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' }),
      });
    } catch (e) {
      console.error('Failed to update class status:', e);
    }
    router.push('/instructor/live-classes');
  };

  const handleLeave = () => {
    router.push('/instructor/live-classes');
  };

  return (
    <JitsiMeetingComponent
      roomName={roomName}
      displayName={displayName}
      email={email}
      subject={subject}
      isInstructor={true}
      onEnd={handleEnd}
      onLeave={handleLeave}
    />
  );
}