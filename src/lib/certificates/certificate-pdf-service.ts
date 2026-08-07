import { Certificate, CertificateTemplate, CertificateBranding } from '@/types/certificates';

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16) / 255} ${parseInt(result[2], 16) / 255} ${parseInt(result[3], 16) / 255}`
    : '0 0 0';
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const approxWidth = testLine.length * fontSize * 0.55;

    if (approxWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

export class CertificatePDFService {
  generateHTML(certificate: any, template: any, branding: any): string {
    const primaryColor = branding?.primaryColor || '#1a1a2e';
    const secondaryColor = branding?.secondaryColor || '#16213e';
    const accentColor = branding?.accentColor || '#e94560';
    const fontFamily = branding?.fontFamily || 'serif';
    const logoSvg = branding?.logoUrl
      ? `<img src="${branding.logoUrl}" style="width: 120px; height: 120px; object-fit: contain;" />`
      : '';

    const designConfig = template?.designConfig || {};

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${certificate.certificateNumber}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${fontFamily}, Georgia, serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .certificate {
      width: 297mm;
      height: 210mm;
      background: white;
      border: 20px solid ${primaryColor};
      border-radius: 10px;
      position: relative;
      padding: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    .certificate::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 2px solid ${accentColor};
      border-radius: 5px;
      pointer-events: none;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      margin-bottom: 20px;
    }
    .title {
      font-size: 48px;
      font-weight: bold;
      color: ${primaryColor};
      text-transform: uppercase;
      letter-spacing: 4px;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 18px;
      color: ${secondaryColor};
      letter-spacing: 2px;
    }
    .content {
      margin: 40px 0;
      text-align: center;
    }
    .recipient {
      font-size: 36px;
      font-weight: bold;
      color: ${primaryColor};
      border-bottom: 2px solid ${accentColor};
      display: inline-block;
      padding: 0 40px 10px;
      margin: 20px 0;
    }
    .description {
      font-size: 16px;
      color: #333;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
    }
    .course-title {
      font-size: 24px;
      font-weight: bold;
      color: ${secondaryColor};
      margin: 20px 0;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      width: 100%;
      margin-top: auto;
      padding-top: 40px;
    }
    .signature {
      text-align: center;
    }
    .signature-image {
      height: 80px;
      object-fit: contain;
      margin-bottom: 10px;
    }
    .signature-line {
      width: 200px;
      border-top: 1px solid ${primaryColor};
      margin-top: 10px;
      padding-top: 5px;
    }
    .signature-name {
      font-size: 14px;
      font-weight: bold;
      color: ${primaryColor};
    }
    .signature-title {
      font-size: 12px;
      color: #666;
    }
    .details {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 20px;
    }
    .certificate-number {
      font-size: 14px;
      color: ${accentColor};
      font-weight: bold;
      margin-bottom: 5px;
    }
    .verification {
      font-size: 11px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      ${logoSvg}
      <h1 class="title">Certificate of Achievement</h1>
      <p class="subtitle">This is to certify that</p>
    </div>

    <div class="content">
      <div class="recipient">${certificate.student?.user?.fullName || 'Student'}</div>
      <p class="description">${certificate.description || 'Has successfully completed the requirements for'}</p>
      <div class="course-title">${certificate.title}</div>
    </div>

    <div class="footer">
      <div class="signature">
        <div class="signature-line">
          <div class="signature-name">Authorized Signatory</div>
          <div class="signature-title">StudyHub Malawi</div>
        </div>
      </div>
      <div class="signature">
        <div class="signature-line">
          <div class="signature-name">Date</div>
          <div class="signature-title">${new Date(certificate.issuedAt).toLocaleDateString()}</div>
        </div>
      </div>
    </div>

    <div class="details">
      <div class="certificate-number">${certificate.certificateNumber}</div>
      <div class="verification">Verify at: ${process.env.NEXT_PUBLIC_URL}/verify-certificate/${certificate.verificationId}</div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  generatePrintableHTML(html: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate</title>
  <style>
    @page { size: A4; margin: 0; }
    body { margin: 0; padding: 0; }
  </style>
</head>
<body onload="window.print()">
  ${html}
</body>
</html>
    `.trim();
  }

  generatePDF(certificate: any, template: any, branding: any): Buffer {
    const primaryColor = branding?.primaryColor || '#1a1a2e';
    const secondaryColor = branding?.secondaryColor || '#16213e';
    const accentColor = branding?.accentColor || '#e94560';
    const recipientName = certificate.student?.user?.fullName || 'Student';
    const title = certificate.title || 'Certificate of Achievement';
    const description = certificate.description || 'Has successfully completed the requirements for';
    const certificateNumber = certificate.certificateNumber;
    const issuedDate = new Date(certificate.issuedAt).toLocaleDateString();
    const verificationUrl = `${process.env.NEXT_PUBLIC_URL || 'https://studyhub.mw'}/verify-certificate/${certificate.verificationId}`;

    const layout = template?.designConfig?.layout || 'landscape';
    const isLandscape = layout === 'landscape';

    const pageWidth = isLandscape ? 841.89 : 595.28;
    const pageHeight = isLandscape ? 595.28 : 841.89;

    const primaryRGB = hexToRgb(primaryColor);
    const accentRGB = hexToRgb(accentColor);

    const margin = 50;
    const borderWidth = 20;
    const innerBorderOffset = 12;
    const contentWidth = pageWidth - margin * 2;
    const centerX = pageWidth / 2;

    const headerLines = wrapText('StudyHub Malawi', contentWidth, isLandscape ? 22 : 28);
    const titleLines = wrapText('CERTIFICATE OF ACHIEVEMENT', contentWidth, isLandscape ? 36 : 44);
    const subtitleLine = 'This is to certify that';
    const recipientLines = wrapText(recipientName, contentWidth, isLandscape ? 26 : 32);
    const descriptionLines = wrapText(description, contentWidth, isLandscape ? 13 : 15);
    const courseTitleLines = wrapText(title, contentWidth, isLandscape ? 18 : 22);

    const objects: { id: number; content: string }[] = [];
    const streamParts: string[] = [];

    streamParts.push('q');

    streamParts.push(
      `${margin} ${margin} ${pageWidth - margin * 2} ${pageHeight - margin * 2} re`,
      `${primaryRGB} rg`,
      'f'
    );

    streamParts.push(
      `${margin + innerBorderOffset} ${margin + innerBorderOffset} ${pageWidth - (margin + innerBorderOffset) * 2} ${pageHeight - (margin + innerBorderOffset) * 2} re`,
      `${accentRGB} rg`,
      'f'
    );

    streamParts.push('Q');

    streamParts.push('BT', '/F1 1 Tf', '0 0 0 rg');

    let yCursor = pageHeight - margin - 60;

    const drawLines = (lines: string[], fontSize: number) => {
      streamParts.push(`/F1 ${fontSize} Tf`, `${primaryRGB} rg`);
      for (const line of lines) {
        streamParts.push(`${centerX} ${yCursor} Td`, `(${line}) Tj`);
        yCursor -= fontSize + 6;
      }
      yCursor -= 14;
    };

    for (const line of headerLines) {
      drawLines([line], isLandscape ? 22 : 28);
    }

    for (const line of titleLines) {
      drawLines([line], isLandscape ? 36 : 44);
    }

    yCursor -= 10;
    drawLines([subtitleLine], isLandscape ? 14 : 16);

    for (const line of recipientLines) {
      drawLines([line], isLandscape ? 26 : 32);
    }

    for (const line of descriptionLines) {
      drawLines([line], isLandscape ? 13 : 15);
    }

    for (const line of courseTitleLines) {
      drawLines([line], isLandscape ? 18 : 22);
    }

    const footerY = margin + 40;
    streamParts.push('BT', '/F1 10 Tf', `${margin} ${footerY} Td`, `(Certificate Number: ${certificateNumber}) Tj`);
    streamParts.push(`${pageWidth - margin} ${footerY} Td`, `(Date: ${issuedDate}) Tj`);
    streamParts.push(`${margin} ${footerY - 20} Td`, `(Verify at: ${verificationUrl}) Tj`, 'ET');

    const contentStream = streamParts.join('\n');

    objects.push(
      { id: 1, content: '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj' },
      { id: 2, content: '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj' },
      {
        id: 3,
        content: `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj`,
      },
      { id: 4, content: `4 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf-8')} >>\nstream\n${contentStream}\nendstream\nendobj` },
      { id: 5, content: '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj' },
      { id: 6, content: '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj' }
    );

    const headerText = '%PDF-1.4\n';
    const parts: string[] = [headerText];
    const offsets: number[] = [0];

    for (const obj of objects) {
      offsets.push(Buffer.byteLength(parts.join(''), 'utf-8'));
      parts.push(`${obj.content}\n`);
    }

    const body = parts.join('');
    const xrefStart = Buffer.byteLength(body, 'utf-8');

    let xref = 'xref\n';
    xref += `0 ${objects.length + 1}\n`;
    xref += '0000000000 65535 f \n';

    for (let i = 1; i <= objects.length; i++) {
      const offset = offsets[i];
      xref += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    }

    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    return Buffer.from(body + xref + trailer, 'utf-8');
  }
}

export const certificatePDFService = new CertificatePDFService();
