import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { subscriptionService } from '@/lib/billing/subscription-service';

// Get current subscription
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await subscriptionService.getCurrentSubscription(session.user.id);

    return NextResponse.json({
      success: true,
      data: subscription,
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

// Create subscription
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tier, cycle, paymentMethod, institutionId, promoCode } = body;

    if (!tier || !cycle || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const subscription = await subscriptionService.createSubscription({
      userId: session.user.id,
      tier,
      cycle,
      paymentMethod,
      institutionId,
      promoCode,
    });

    return NextResponse.json({
      success: true,
      data: subscription,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create subscription error:', error);
    
    if (error.code === 'PAYMENT_FAILED') {
      return NextResponse.json(
        { error: error.message },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId, reason } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    await subscriptionService.cancelSubscription(subscriptionId, reason);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}