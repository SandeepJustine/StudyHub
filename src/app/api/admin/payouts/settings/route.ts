import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { AuditLogger } from '@/lib/security/audit-logger';

const auditLogger = new AuditLogger();

// Default payout settings
const DEFAULT_SETTINGS = {
  minimumPayout: 10000, // MWK 10,000 minimum
  payoutSchedule: 'monthly',
  payoutDay: 15,
  autoApprove: false,
  paymentMethods: ['AIRTEL_MONEY', 'TNM_MPAMBA', 'BANK_TRANSFER'],
  processingFee: 0, // No fee for now
  holdPeriod: 7, // Days to hold before payout
  maxBulkProcess: 50, // Max payouts to process at once
};

/**
 * GET /api/admin/payouts/settings
 * Get current payout settings
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // In production, fetch from database
    // For now, return default settings
    return NextResponse.json({
      success: true,
      data: DEFAULT_SETTINGS,
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch payout settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/payouts/settings
 * Update payout settings
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // Validate settings
    if (settings.minimumPayout && settings.minimumPayout < 1000) {
      return NextResponse.json(
        { error: 'Minimum payout must be at least MWK 1,000' },
        { status: 400 }
      );
    }

    if (settings.payoutDay && (settings.payoutDay < 1 || settings.payoutDay > 28)) {
      return NextResponse.json(
        { error: 'Payout day must be between 1 and 28' },
        { status: 400 }
      );
    }

    // Merge with defaults
    const updatedSettings = {
      ...DEFAULT_SETTINGS,
      ...settings,
    };

    // In production, save to database
    // For now, just log and return

    // Log audit
    await auditLogger.logAction({
      adminId: session.user.id,
      action: 'UPDATE_PAYOUT_SETTINGS',
      entity: 'PAYOUT_SETTINGS',
      entityId: 'GLOBAL',
      changes: {
        previous: DEFAULT_SETTINGS,
        updated: updatedSettings,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Payout settings updated successfully',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update payout settings' },
      { status: 500 }
    );
  }
}