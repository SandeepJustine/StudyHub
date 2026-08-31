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
    if (!session?.user || session.user.role !== 'CORPORATE_CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPEG, SVG, WebP' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'corporate', 'logos');
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name) || '.png';
    const filename = `${session.user.id}-${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const baseUrl = getBaseUrl(req);
    const publicUrl = `${baseUrl}/uploads/corporate/logos/${filename}`;

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload logo' },
      { status: 500 }
    );
  }
}
