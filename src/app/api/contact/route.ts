import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, email, phone, category, subject, message } = body;

    // Create a support ticket for anonymous/public contact submissions
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session?.user?.id || 'anonymous',
        category: category || 'general',
        subject: subject || 'Contact Form Submission',
        description: `Contact form submission from ${name || 'Anonymous'} (${email || 'no email'}):\n\n${message}`,
        priority: 'normal',
        status: 'open',
      },
    });

    return NextResponse.json(
      { success: true, message: 'Your message has been received. We will get back to you within 24 hours.' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit message' },
      { status: 500 }
    );
  }
}
