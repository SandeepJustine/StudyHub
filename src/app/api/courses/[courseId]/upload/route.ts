import { NextResponse } from 'next/server'; import { getServerSession } from 'next-auth'; import { authOptions } from '@/lib/auth/auth-options'; import prisma from '@/lib/utils/prisma'; import { writeFile } from 'fs/promises'; import path from 'path';

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const session = await getServerSession(authOptions); if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { courseId } = await params;
    const formData = await req.formData(); const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    const bytes = await file.arrayBuffer(); const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'courses', courseId);
    await import('fs/promises').then(fs => fs.mkdir(uploadDir, { recursive: true }));
    await writeFile(path.join(uploadDir, filename), buffer);
    const url = `/uploads/courses/${courseId}/${filename}`;
    return NextResponse.json({ success: true, data: { url, filename, size: file.size } }, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: 'Upload failed' }, { status: 500 }); }
}
