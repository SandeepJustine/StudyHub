export type CertificateType = 'DIGITAL' | 'PRINTED' | 'VERIFIED';
export type CertificateDelivery = 'DIGITAL' | 'PRINTED' | 'BOTH';
export type CertificatePaymentStatus = 'PENDING' | 'PAID' | 'FREE';

export interface CertificateDesignConfig {
  layout: 'landscape' | 'portrait';
  borderStyle: 'single' | 'double' | 'decorative';
  borderWidth: number;
  borderColor: string;
  innerBorderColor: string;
  headerText: string;
  subheaderText: string;
  footerText: string;
  showLogo: boolean;
  showSeal: boolean;
  showSignature: boolean;
  signatureLines: number;
  primaryFont: string;
  secondaryFont: string;
  titleFontSize: number;
  subtitleFontSize: number;
  recipientFontSize: number;
  descriptionFontSize: number;
  courseTitleFontSize: number;
  spacing: {
    headerMargin: number;
    contentMargin: number;
    footerMargin: number;
  };
  logoUrl?: string | null;
  backgroundPattern?: string | null;
  signatures?: Array<{
    name: string;
    title: string;
    imageUrl?: string | null;
    type?: 'uploaded' | 'typed' | 'drawn';
    data?: string | null;
  }>;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  isActive: boolean;
  designConfig?: CertificateDesignConfig | null;
  createdBy: string;
  createdByRole: string;
  institutionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateSignature {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  type: string;
  relatedId: string;
  instructorId?: string | null;
  institutionId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateBranding {
  id: string;
  institutionId: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  fontFamily?: string | null;
  logoUrl?: string | null;
  sealUrl?: string | null;
  customTemplate?: Record<string, any> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  studentId: string;
  examAttemptId?: string | null;
  templateId: string;
  type: CertificateType;
  delivery: CertificateDelivery;
  title: string;
  description?: string | null;
  verificationId: string;
  issuedAt: Date;
  expiresAt?: Date | null;
  paymentStatus: CertificatePaymentStatus;
  transactionId?: string | null;
  amount: number;
  issuedBy?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateCertificateData {
  studentId: string;
  enrollmentId?: string;
  examAttemptId?: string;
  templateId: string;
  type: CertificateType;
  delivery: CertificateDelivery;
  title: string;
  description?: string;
  issuedBy?: string;
}

export interface StudentCertificate extends Certificate {
  enrollment?: {
    course: {
      title: string;
      subject: string;
    };
  } | null;
  examAttempt?: {
    quiz: {
      title: string;
    };
  } | null;
  template?: CertificateTemplate;
}

export interface VerifiedCertificateResponse {
  verified: true;
  certificate: {
    id: string;
    verificationId: string;
    type: CertificateType;
    title: string;
    description?: string | null;
    issuedAt: Date;
    expiresAt?: Date | null;
    studentName: string;
    courseTitle?: string | null;
    instructorName?: string | null;
    metadata: Record<string, any>;
  };
}

export interface CertificateQRData {
  url: string;
  verificationId: string;
  timestamp: string;
}

export interface PublicVerificationResult {
  verified: true;
  certificate: {
    id: string;
    verificationId: string;
    type: CertificateType;
    title: string;
    issuedAt: Date;
    student: {
      user: {
        fullName: string;
      };
    };
    enrollment?: {
      course: {
        title: string;
        subject: string;
      };
    } | null;
    examAttempt?: {
      score: number;
      passed: boolean;
      quiz: {
        title: string;
      };
    } | null;
  };
}
