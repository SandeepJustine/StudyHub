import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { verifyRecaptcha, isRecaptchaEnabled } from '@/lib/captcha';
import { contactRateLimiter } from '@/lib/contact/rate-limiter';
import prisma from '@/lib/utils/prisma';

export async function POST(req: Request) {
  try {
    const rateLimit = contactRateLimiter.check(req);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many submissions. Please try again in ${rateLimit.retryAfter} seconds.` },
        { status: 429 }
      );
    }

    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, email, phone, category, subject, message, company, recaptchaToken, mathAnswer } = body;

    if (company && company.trim() !== '') {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (isRecaptchaEnabled()) {
      if (!recaptchaToken) {
        return NextResponse.json({ error: 'reCAPTCHA verification required' }, { status: 400 });
      }

      const recaptchaResult = await verifyRecaptcha(recaptchaToken);
      if (!recaptchaResult.success) {
        return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 403 });
      }
    }

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

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
