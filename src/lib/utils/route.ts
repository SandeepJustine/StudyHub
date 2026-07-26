import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/utils/prisma';

// Placeholder for student badges
const mockBadges = [
  {
    id: 'badge-001',
    name: 'Chemistry Novice',
    description: 'Completed 1 chemistry experiment.',
    icon: '🧪',
    earnedAt: new Date('2026-07-20T11:00:00Z'),
  },
  {
    id: 'badge-002',
    name: 'Experimenter',
    description: 'Completed 5 experiments across any subject.',
    icon: '🌟',
    earnedAt: new Date('2026-07-22T14:30:00Z'),
  },
];

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(mockBadges);
}