import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { subscriptionService } from '@/lib/billing/subscription-service';
import { AdminAnalyticsService } from '@/lib/analytics/admin-analytics';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verify admin access
    if (!session?.user || session.user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const analyticsService = new AdminAnalyticsService();
    const metrics = await analyticsService.getDashboardMetrics();

    return NextResponse.json({
      success: true,
      data: metrics,
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}