import { NextResponse } from 'next/server';
import prisma from '@/lib/utils/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, company, message, packageId, packageName } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const trainingPackage = await prisma.corporateTrainingPackage.findUnique({
      where: { id: packageId },
      include: {
        corporate: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!trainingPackage) {
      return NextResponse.json({ error: 'Training package not found' }, { status: 404 });
    }

    const corporateUserId = trainingPackage.corporate.userId;

    const notification = await prisma.notification.create({
      data: {
        userId: corporateUserId,
        type: 'TRAINING_INQUIRY',
        title: `New Training Inquiry: ${trainingPackage.title}`,
        message: `${name} from ${company || 'a company'} is interested in "${trainingPackage.title}". Contact: ${email}${phone ? `, ${phone}` : ''}`,
        channels: ['EMAIL', 'PUSH'],
        status: 'pending',
        metadata: {
          applicantName: name,
          applicantEmail: email,
          applicantPhone: phone || null,
          applicantCompany: company || null,
          message: message || null,
          packageId: trainingPackage.id,
          packageName: trainingPackage.title,
          status: 'pending',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Inquiry submitted successfully. The training provider will be notified.',
      inquiryId: notification.id,
    });
  } catch (error: any) {
    console.error('Contact sales error:', error);
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}
