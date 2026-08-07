import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { certificateTemplateService } from '@/lib/certificates/certificate-template-service';
import { featureGating } from '@/lib/billing/feature-gating';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const template = await certificateTemplateService.getTemplateById(id);

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Get template error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, designConfig, isActive, isDefault } = body;

    const canUpdateTemplate =
      session.user.role === 'PLATFORM_ADMIN' ||
      session.user.role === 'SCHOOL_ADMIN' ||
      (session.user.role === 'INSTRUCTOR' && featureGating.checkAccess(session.user.id, 'certificate:create'));

    if (!canUpdateTemplate) {
      return NextResponse.json(
        { error: 'You do not have permission to update templates' },
        { status: 403 }
      );
    }

    const template = await certificateTemplateService.updateTemplate(
      id,
      { name, description, designConfig, isActive, isDefault },
      session.user.id,
      session.user.role
    );

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Update template error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const canDeleteTemplate =
      session.user.role === 'PLATFORM_ADMIN' ||
      session.user.role === 'SCHOOL_ADMIN' ||
      (session.user.role === 'INSTRUCTOR' && featureGating.checkAccess(session.user.id, 'certificate:create'));

    if (!canDeleteTemplate) {
      return NextResponse.json(
        { error: 'You do not have permission to delete templates' },
        { status: 403 }
      );
    }

    await certificateTemplateService.deleteTemplate(id, session.user.id, session.user.role);

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}
