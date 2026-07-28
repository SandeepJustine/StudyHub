import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

// In-memory settings store (in production, use database)
let currentSettings = {
  platformName: 'StudyHub Malawi',
  tagline: 'Learn. Practice. Succeed.',
  supportEmail: 'support@studyhub.mw',
  supportPhone: '+265 888 000 000',
  minimumPayout: 10000,
  payoutDay: 15,
  commissionRate: 30,
  smsEnabled: true,
  emailEnabled: true,
  pushEnabled: true,
  mfaRequired: false,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  defaultLocale: 'en',
  defaultCurrency: 'MWK',
  timezone: 'Africa/Blantyre',
};

/**
 * GET /api/admin/settings
 * Get platform settings
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: currentSettings,
    });

  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Update platform settings
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { section, settings } = body;

    if (!section || !settings) {
      return NextResponse.json(
        { error: 'Section and settings are required' },
        { status: 400 }
      );
    }

    // Validate settings based on section
    const validationErrors: string[] = [];
    const sectionLower = section.toLowerCase();

    switch (sectionLower) {
      case 'general':
        if (settings.platformName && settings.platformName.length < 3) {
          validationErrors.push('Platform name must be at least 3 characters');
        }
        if (settings.supportEmail && !settings.supportEmail.includes('@')) {
          validationErrors.push('Invalid support email');
        }
        break;

      case 'payment':
        if (settings.minimumPayout !== undefined && settings.minimumPayout < 1000) {
          validationErrors.push('Minimum payout must be at least MWK 1,000');
        }
        if (settings.payoutDay !== undefined && (settings.payoutDay < 1 || settings.payoutDay > 28)) {
          validationErrors.push('Payout day must be between 1 and 28');
        }
        if (settings.commissionRate !== undefined && (settings.commissionRate < 0 || settings.commissionRate > 100)) {
          validationErrors.push('Commission rate must be between 0 and 100');
        }
        break;

      case 'notification':
        // Boolean values don't need validation
        break;

      case 'security':
        if (settings.sessionTimeout !== undefined && settings.sessionTimeout < 5) {
          validationErrors.push('Session timeout must be at least 5 minutes');
        }
        if (settings.maxLoginAttempts !== undefined && settings.maxLoginAttempts < 3) {
          validationErrors.push('Max login attempts must be at least 3');
        }
        break;

      case 'localization':
        const validLocales = ['en', 'ny'];
        if (settings.defaultLocale && !validLocales.includes(settings.defaultLocale)) {
          validationErrors.push('Invalid locale. Must be "en" or "ny"');
        }
        break;

      default:
        validationErrors.push(`Unknown settings section: ${section}`);
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Save settings (merge with current)
    const previousSettings = { ...currentSettings };
    currentSettings = { ...currentSettings, ...settings };

    // Log audit
    try {
      await prisma.auditLog.create({
        data: {
          adminId: session.user.id,
          action: 'SETTINGS_UPDATED',
          entity: 'SETTINGS',
          entityId: section,
          changes: {
            section,
            previous: previousSettings,
            updated: currentSettings,
          },
          timestamp: new Date(),
        },
      });
    } catch (auditError) {
      console.error('Failed to log audit:', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      data: currentSettings,
      message: `${section} settings saved successfully`,
    });

  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}