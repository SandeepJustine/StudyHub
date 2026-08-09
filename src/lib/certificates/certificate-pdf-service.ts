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
    const designConfig = template?.designConfig || {};
    const primaryColor = branding?.primaryColor || designConfig.borderColor || '#0D1B3D';
    const accentColor = branding?.accentColor || designConfig.innerBorderColor || '#E63946';
    const primaryFont = branding?.fontFamily || designConfig.primaryFont || 'Poppins, sans-serif';
    const secondaryFont = designConfig.secondaryFont || 'Georgia, serif';
    const logoSvg = designConfig.logoUrl
      ? `<img src="${designConfig.logoUrl}" style="width: 120px; height: 120px; object-fit: contain;" />`
      : '';
    const watermarkSvg = designConfig.backgroundPattern
      ? `<img src="${designConfig.backgroundPattern}" class="watermark" />`
      : '';

    const signatures = designConfig.signatures || [];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${certificate.certificateNumber}</title>
  <style>
    @page { size: A4; margin: 0; }
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Georgia&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${primaryFont};
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .certificate {
      width: 297mm;
      height: 210mm;
      background: white;
      border: 1px solid #ccc;
      position: relative;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .border-frame {
      content: '';
      position: absolute;
      top: 1rem; left: 1rem; right: 1rem; bottom: 1rem;
      border: 8px solid ${primaryColor};
      pointer-events: none;
    }
    .border-frame::after {
      content: '';
      position: absolute;
      top: 0.5rem; left: 0.5rem; right: 0.5rem; bottom: 0.5rem;
      border: 2px solid ${accentColor};
      pointer-events: none;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      opacity: 0.08;
      pointer-events: none;
      width: 400px;
      height: 400px;
      z-index: 0;
    }
    .header {
      position: relative; z-index: 1;
      text-align: center;
      margin-bottom: 2rem;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      width: 100px;
      height: 100px;
    }
    .title {
      font-size: ${designConfig.titleFontSize || 36}px;
      font-weight: 700;
      color: ${primaryColor};
      text-transform: uppercase;
      letter-spacing: 4px;
      margin: 0;
    }
    .subtitle {
      font-size: ${designConfig.subtitleFontSize || 16}px;
      color: #555;
      letter-spacing: 2px;
      margin-top: 1.5rem;
    }
    .content {
      position: relative; z-index: 1;
      margin: 2rem 0;
      text-align: center;
      flex-grow: 1;
    }
    .recipient {
      font-family: ${secondaryFont};
      font-size: ${designConfig.recipientFontSize || 48}px;
      font-weight: 400;
      color: ${accentColor};
      border-bottom: 2px solid #eee;
      display: inline-block;
      padding: 0 2rem 0.5rem;
      margin: 1rem 0;
    }
    .description {
      font-size: ${designConfig.descriptionFontSize || 18}px;
      color: #333;
      line-height: 1.6;
      max-width: 700px;
      margin: 0 auto;
    }
    .course-title {
      font-size: ${designConfig.courseTitleFontSize || 28}px;
      font-weight: 600;
      color: ${primaryColor};
      margin: 1.5rem 0;
    }
    .footer {
      position: relative; z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      width: 100%;
      margin-top: auto;
      padding-top: 2rem;
    }
    .signature {
      text-align: center;
      width: 250px;
    }
    .signature-line {
      border-top: 1px solid #999;
      margin: 2rem 0 0.5rem;
      padding-top: 0.5rem;
    }
    .signature-name {
      font-size: 14px;
      font-weight: 600;
      color: ${primaryColor};
    }
    .signature-title {
      font-size: 12px;
      color: #666;
    }
    .details {
      position: relative; z-index: 1;
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 20px;
    }
    .certificate-number {
      font-size: 14px;
      color: #333;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .verification {
      font-size: 11px;
      color: #999;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="border-frame"></div>
    ${watermarkSvg}

    <div class="header">
      <div class="logo">${logoSvg}</div>
      <h1 class="title">${designConfig.headerText || 'Certificate of Achievement'}</h1>
      <div class="logo"></div>
    </div>

    <div class="content">
      <p class="subtitle">${designConfig.subheaderText || 'This is to certify that'}</p>
      <div class="recipient">${certificate.student?.user?.fullName || 'Student'}</div>
      <p class="description">${certificate.description || 'Has successfully completed the requirements for'}</p>
      <div class="course-title">${certificate.title}</div>
    </div>

    <div class="footer">
        ${signatures.map((sig: any) => `
        <div class="signature">
          ${sig.imageUrl ? `<img src="${sig.imageUrl}" class="signature-image" style="height: 80px; object-fit: contain; margin-bottom: 10px;" />` : ''}
          ${sig.data && sig.type === 'drawn' ? `<img src="${sig.data}" class="signature-image" style="height: 80px; object-fit: contain; margin-bottom: 10px;" />` : ''}
          <div class="signature-line"></div>
          <div class="signature-name">${sig.name || 'Authorized Signatory'}</div>
          <div class="signature-title">${sig.title || 'StudyHub Malawi'}</div>
        </div>
        `).join('')}
        <div class="details">
            <div class="certificate-number">Certificate No: ${certificate.certificateNumber}</div>
            <div class="verification">${(designConfig.footerText || 'Verify at: {{verificationUrl}}').replace('{{verificationUrl}}', `${process.env.NEXT_PUBLIC_URL}/verify-certificate/${certificate.verificationId}`)}</div>
        </div>
        <div class="signature">
            <div class="signature-line"></div>
            <div class="signature-name">Date Issued</div>
            <div class="signature-title">${new Date(certificate.issuedAt).toLocaleDateString()}</div>
        </div>
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
    const verificationUrl = `${process.env.NEXT_PUBLIC_URL || 'https://studyhubmw.com'}/verify-certificate/${certificate.verificationId}`;

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
