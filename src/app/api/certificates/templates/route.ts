import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { certificateTemplateService } from '@/lib/certificates/certificate-template-service';
import { featureGating } from '@/lib/billing/feature-gating';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get('institutionId');
    const createdByRole = searchParams.get('createdByRole');

    const templates = await certificateTemplateService.getTemplates({
      institutionId: institutionId || undefined,
      createdByRole: createdByRole || undefined,
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
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
    const { name, description, designConfig, institutionId, isDefault } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    const canCreateTemplate =
      session.user.role === 'PLATFORM_ADMIN' ||
      session.user.role === 'SCHOOL_ADMIN' ||
      (session.user.role === 'INSTRUCTOR' && featureGating.checkAccess(session.user.id, 'certificate:create'));

    if (!canCreateTemplate) {
      return NextResponse.json(
        { error: 'You do not have permission to create templates' },
        { status: 403 }
      );
    }

    const template = await certificateTemplateService.createTemplate({
      name,
      description,
      designConfig,
      createdBy: session.user.id,
      createdByRole: session.user.role,
      institutionId,
      isDefault,
    });

    return NextResponse.json({
      success: true,
      data: template,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
