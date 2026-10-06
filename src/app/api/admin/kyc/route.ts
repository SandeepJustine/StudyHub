import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

/**
 * GET /api/admin/kyc
 * List all KYC documents with optional status filter.
 * Query: ?status=PENDING|APPROVED|REJECTED&instructorId=...
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const instructorId = searchParams.get('instructorId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (instructorId) where.instructorId = instructorId;

    const [docs, total] = await Promise.all([
      prisma.kycDocument.findMany({
        where,
        include: {
          instructor: { include: { user: { select: { fullName: true, email: true } } } },
          reviewer: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.kycDocument.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: docs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Admin KYC list error:', error);
    return NextResponse.json({ error: 'Failed to fetch KYC documents' }, { status: 500 });
  }
}

/**
 * POST /api/admin/kyc
 * Review a KYC document: approve or reject.
 * Body: { documentId, action: 'approve'|'reject', reviewNote?: string }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { documentId, action, reviewNote } = body;

    if (!documentId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        error: 'documentId and action (approve|reject) are required',
      }, { status: 400 });
    }

    const doc = await prisma.kycDocument.findUnique({
      where: { id: documentId },
      include: { instructor: { include: { user: { select: { fullName: true } } } } },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.status !== 'PENDING') {
      return NextResponse.json({
        error: `Document is already ${doc.status.toLowerCase()}`,
      }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const updated = await prisma.kycDocument.update({
      where: { id: documentId },
      data: {
        status: newStatus,
        reviewedById: session.user.id,
        reviewNote: typeof reviewNote === 'string' ? reviewNote.slice(0, 1024) : undefined,
        reviewedAt: new Date(),
      },
      include: {
        instructor: { include: { user: { select: { fullName: true, email: true } } } },
        reviewer: { select: { fullName: true, email: true } },
      },
    });

    // If all documents for this instructor are now approved, mark instructor as verified.
    const pendingCount = await prisma.kycDocument.count({
      where: { instructorId: doc.instructorId, status: 'PENDING' },
    });

    if (pendingCount === 0) {
      const approvedCount = await prisma.kycDocument.count({
        where: { instructorId: doc.instructorId, status: 'APPROVED' },
      });

      if (approvedCount > 0) {
        await prisma.instructor.update({
          where: { id: doc.instructorId },
          data: { isVerified: true },
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Admin KYC review error:', error);
    return NextResponse.json({ error: 'Failed to review document' }, { status: 500 });
  }
}
