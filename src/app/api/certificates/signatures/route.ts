import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { certificateSignatureService } from '@/lib/certificates/certificate-signature-service';
import { featureGating } from '@/lib/billing/feature-gating';

function normalizeUrl(url: string | null | undefined, req: Request): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const relatedId = searchParams.get('relatedId');
    const instructorId = searchParams.get('instructorId');
    const institutionId = searchParams.get('institutionId');

    const signatures = await certificateSignatureService.getSignatures({
      type: type || undefined,
      relatedId: relatedId || undefined,
      instructorId: instructorId || undefined,
      institutionId: institutionId || undefined,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      data: signatures,
    });
  } catch (error: any) {
    console.error('Get signatures error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch signatures' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, title, imageUrl, type, institutionId } = body;

    if (!name || !title || !imageUrl || !type) {
      return NextResponse.json(
        { error: 'Name, title, imageUrl, and type are required' },
        { status: 400 }
      );
    }

    let instructorId: string | undefined;
    let relatedId = session.user.id;

    if (type === 'INSTRUCTOR') {
      const hasAccess = await featureGating.checkAccess(session.user.id, 'certificate:sign');
      if (!hasAccess.hasAccess) {
        return NextResponse.json(
          { error: 'Instructor Pro subscription required to add signatures' },
          { status: 403 }
        );
      }

      const instructor = await prisma.instructor.findUnique({
        where: { userId: session.user.id },
      });

      if (!instructor) {
        return NextResponse.json(
          { error: 'Instructor profile not found' },
          { status: 404 }
        );
      }

      instructorId = instructor.id;
    } else if (type === 'INSTITUTION') {
      const schoolAdmin = await prisma.schoolAdmin.findFirst({
        where: { userId: session.user.id },
      });

      if (!schoolAdmin) {
        return NextResponse.json(
          { error: 'Institution admin profile not found' },
          { status: 404 }
        );
      }

      relatedId = schoolAdmin.institutionId;
    }

    const signature = await certificateSignatureService.createSignature({
      name,
      title,
      imageUrl: normalizeUrl(imageUrl, req) || imageUrl,
      type,
      relatedId,
      instructorId: instructorId || undefined,
      institutionId: institutionId || undefined,
    });

    return NextResponse.json({
      success: true,
      data: signature,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create signature error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create signature' },
      { status: 500 }
    );
  }
}
