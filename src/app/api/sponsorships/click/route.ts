import { NextResponse } from 'next/server';
import prisma from '@/lib/utils/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sponsorshipId } = body;

    if (!sponsorshipId) {
      return NextResponse.json({ error: 'sponsorshipId is required' }, { status: 400 });
    }

    await prisma.sponsorshipSlot.update({
      where: { id: sponsorshipId },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
