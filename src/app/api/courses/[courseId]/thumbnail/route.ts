import { NextResponse } from 'next/server'; import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth/auth-options'; import prisma from '@/lib/utils/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await getServerSession(authOptions); if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { courseId } = await params;
    const { thumbnailUrl } = await req.json();
    if (!thumbnailUrl) return NextResponse.json({ error: 'thumbnailUrl required' }, { status: 400 });
    const course = await prisma.course.update({ where: { id: courseId }, data: { thumbnail: thumbnailUrl } });
    return NextResponse.json({ success: true, data: course });
  } catch (e: any) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
