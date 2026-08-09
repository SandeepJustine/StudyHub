import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/utils/prisma';
import { certificateService } from '@/lib/certificates/certificate-service';
import { certificatePDFService } from '@/lib/certificates/certificate-pdf-service';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const template = await prisma.certificateTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const sampleCertificate = {
      id: 'preview',
      certificateNumber: 'PREVIEW-001',
      student: {
        user: { fullName: 'John Doe', email: 'john@example.com' },
      },
      title: (template.designConfig as any)?.headerText || 'Certificate of Achievement',
      description: (template.designConfig as any)?.subheaderText || 'This is to certify that',
      issuedAt: new Date(),
      verificationId: 'PREVIEW-VERIFY',
      template: template,
    };

    const html = certificatePDFService.generateHTML(sampleCertificate, template, {});
    const printableHtml = certificatePDFService.generatePrintableHTML(html);

    return new NextResponse(printableHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="preview-template-${id}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Preview template error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preview template' },
      { status: 500 }
    );
  }
}
