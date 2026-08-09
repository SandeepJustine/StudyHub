import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { certificateBrandingService } from '@/lib/certificates/certificate-branding-service';

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
    const institutionId = searchParams.get('institutionId');

    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    const branding = await certificateBrandingService.getBranding(institutionId);

    return NextResponse.json({
      success: true,
      data: branding,
    });
  } catch (error: any) {
    console.error('Get branding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch branding' },
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
    const { institutionId, primaryColor, secondaryColor, accentColor, fontFamily, logoUrl, sealUrl, customTemplate, isActive } = body;

    if (!institutionId) {
      return NextResponse.json(
        { error: 'Institution ID is required' },
        { status: 400 }
      );
    }

    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return NextResponse.json(
        { error: 'Institution not found' },
        { status: 404 }
      );
    }

    const isSilverOrGold = institution.tier === 'INSTITUTION_SILVER' || institution.tier === 'INSTITUTION_GOLD';

    if (!isSilverOrGold) {
      return NextResponse.json(
        { error: 'Custom certificate branding requires Silver or Gold tier' },
        { status: 403 }
      );
    }

    const branding = await certificateBrandingService.createOrUpdateBranding(
      institutionId,
      {
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        logoUrl: normalizeUrl(logoUrl, req),
        sealUrl: normalizeUrl(sealUrl, req),
        customTemplate,
        isActive,
      }
    );

    return NextResponse.json({
      success: true,
      data: branding,
    });
  } catch (error: any) {
    console.error('Save branding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save branding' },
      { status: 500 }
    );
  }
}
