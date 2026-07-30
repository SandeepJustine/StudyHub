import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { forumService } from '@/lib/community/forum-service';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, content, forumId, subject, tags } = body;
    
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const thread = await forumService.createThread(session.user.id, {
      title, content,
      forumId: forumId || undefined,
      subject: subject || undefined,
      tags: tags || [],
    });

    return NextResponse.json({ success: true, data: thread }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
