// src/app/api/webhooks/email/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/utils/prisma';

export async function POST(req: Request) {
  try {
    const events = await req.json();
    
    for (const event of events) {
      switch (event.event) {
        case 'delivered':
          await prisma.notification.updateMany({
            where: { id: event.custom_args?.notificationId },
            data: { emailStatus: 'delivered' },
          });
          break;

        case 'open':
          await prisma.notification.updateMany({
            where: { id: event.custom_args?.notificationId },
            data: { 
              emailStatus: 'opened',
              emailOpenedAt: new Date(event.timestamp * 1000),
            },
          });
          break;

        case 'click':
          await prisma.notification.updateMany({
            where: { id: event.custom_args?.notificationId },
            data: {
              emailClickedAt: new Date(event.timestamp * 1000),
            },
          });
          break;

        case 'bounce':
          // Mark user email as bounced
          await prisma.user.updateMany({
            where: { email: event.email },
            data: { emailBounced: true },
          });
          break;

        case 'spamreport':
          // Increment complaint count
          await prisma.user.updateMany({
            where: { email: event.email },
            data: { emailComplaints: { increment: 1 } },
          });
          break;

        case 'unsubscribe':
          await prisma.user.updateMany({
            where: { email: event.email },
            data: { unsubscribedAt: new Date() },
          });
          break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Email webhook error:', error);
    return NextResponse.json({ error: (error as Error).message || 'Unknown error' }, { status: 500 });
  }
}