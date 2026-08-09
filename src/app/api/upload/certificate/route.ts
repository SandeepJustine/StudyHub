import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

function getBaseUrl(req: Request): string {
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}`;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file || !type) {
      return NextResponse.json(
        { error: 'File and type are required' },
        { status: 400 }
      );
    }

    const allowedTypes = ['logo', 'background', 'signature'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid upload type. Allowed: logo, background, signature' },
        { status: 400 }
      );
    }

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPEG, SVG, WebP' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificates', type);
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const filename = `${session.user.id}-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const baseUrl = getBaseUrl(req);
    const publicUrl = `${baseUrl}/uploads/certificates/${type}/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
