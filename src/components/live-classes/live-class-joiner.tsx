'use client';

import { useRouter } from 'next/navigation';
import { JitsiMeetingComponent } from '@/components/live-classes/jitsi-meeting';

interface LiveClassJoinerProps {
  roomName: string;
  displayName: string;
  email: string;
  subject: string;
}

export function LiveClassJoiner({
  roomName,
  displayName,
  email,
  subject,
}: LiveClassJoinerProps) {
  const router = useRouter();

  const handleLeave = () => {
    router.push('/student/live-classes');
  };

  return (
    <JitsiMeetingComponent
      roomName={roomName}
      displayName={displayName}
      email={email}
      subject={subject}
      isInstructor={false}
      onLeave={handleLeave}
    />
  );
}