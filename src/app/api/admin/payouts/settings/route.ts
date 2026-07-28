import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { AuditLogger } from '@/lib/security/audit-logger';

const auditLogger = new AuditLogger();

// Default payout settings
const DEFAULT_SETTINGS = {
  minimumPayout: 10000,
  payoutSchedule: 'monthly',
  payoutDay: 15,
  autoApprove: false,
  paymentMethods: ['AIRTEL_MONEY', 'TNM_MPAMBA', 'BANK_TRANSFER'],
  processingFee: 0,
  holdPeriod: 7,
  maxBulkProcess: 50,
};

// In-memory settings (in production, store in database)
let currentSettings = { ...DEFAULT_SETTINGS };

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

    return NextResponse.json({
      success: true,
      data: currentSettings,
    });

  } catch (error) {
    console.error('Payout settings error:', error);
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
    if (settings.minimumPayout !== undefined && settings.minimumPayout < 1000) {
      return NextResponse.json(
        { error: 'Minimum payout must be at least MWK 1,000' },
        { status: 400 }
      );
    }

    if (settings.payoutDay !== undefined && (settings.payoutDay < 1 || settings.payoutDay > 28)) {
      return NextResponse.json(
        { error: 'Payout day must be between 1 and 28' },
        { status: 400 }
      );
    }

    if (settings.processingFee !== undefined && (settings.processingFee < 0 || settings.processingFee > 10)) {
      return NextResponse.json(
        { error: 'Processing fee must be between 0 and 10%' },
        { status: 400 }
      );
    }

    // Merge with current settings
    const previousSettings = { ...currentSettings };
    currentSettings = { ...currentSettings, ...settings };

    // Log audit
    await auditLogger.logAction({
      adminId: session.user.id,
      action: 'UPDATE_PAYOUT_SETTINGS',
      entity: 'PAYOUT_SETTINGS',
      entityId: 'GLOBAL',
      changes: {
        previous: previousSettings,
        updated: currentSettings,
      },
    });

    return NextResponse.json({
      success: true,
      data: currentSettings,
      message: 'Payout settings updated successfully',
    });

  } catch (error) {
    console.error('Update payout settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update payout settings' },
      { status: 500 }
    );
  }
}
