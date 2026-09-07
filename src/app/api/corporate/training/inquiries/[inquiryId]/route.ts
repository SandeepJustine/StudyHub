import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { emailService } from '@/services/email-service';

export async function PUT(req: Request, { params }: { params: Promise<{ inquiryId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'CORPORATE_CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { inquiryId } = await params;
    const { action } = await req.json();

    const notification = await prisma.notification.findUnique({
      where: { id: inquiryId },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const metadata = notification.metadata as any;
    const packageId = metadata?.packageId;

    if (!packageId) {
      return NextResponse.json({ error: 'Invalid inquiry data' }, { status: 400 });
    }

    if (action === 'confirm') {
      await prisma.corporateTrainingPackage.update({
        where: { id: packageId },
        data: { enrolledCount: { increment: 1 } },
      });

      const applicantEmail = metadata?.applicantEmail;
      const applicantName = metadata?.applicantName || 'there';
      const packageName = metadata?.packageName || 'the training program';

      if (applicantEmail) {
        try {
          const sent = await emailService.sendEmail({
            to: applicantEmail,
            subject: `Training Enrollment Confirmed: ${packageName}`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
<div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div>
<div style="padding:30px"><h2 style="color:#0D1B3D">Enrollment Confirmed!</h2><p>Hi ${applicantName},</p><p>Great news! Your enrollment in <strong>${packageName}</strong> has been confirmed by the training provider.</p><p>The provider will contact you soon with next steps and schedules.</p><p>Login to your account to view updates.</p>
<a href="${process.env.NEXT_PUBLIC_URL || 'https://studyhub.mw'}/auth/login" style="display:inline-block;background:#E63946;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0">Login to StudyHub</a></div></div>`,
          });
          if (!sent) {
            console.warn('Email returned false for:', applicantEmail);
          }
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }
      }
    }

    await prisma.notification.update({
      where: { id: inquiryId },
      data: {
        status: action === 'confirm' ? 'read' : 'dismissed',
        metadata: {
          ...metadata,
          status: action === 'confirm' ? 'confirmed' : 'rejected',
          respondedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: action === 'confirm' ? 'Enrollment confirmed and applicant notified' : 'Inquiry rejected',
    });
  } catch (error: any) {
    console.error('Inquiry response error:', error);
    return NextResponse.json(
      { error: 'Failed to process inquiry response' },
      { status: 500 }
    );
  }
}
