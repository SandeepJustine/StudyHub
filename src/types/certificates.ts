/**
 * Defines the types of certificates that can be issued.
 * Aligns with the Prisma model.
 */
export type CertificateType = 'DIGITAL' | 'PRINTED' | 'VERIFIED';

/**
 * Base interface for a certificate record in the database.
 * This aligns with the Prisma Certificate model.
 */
export interface Certificate {
  id: string;
  studentId: string;
  enrollmentId?: string | null;
  examAttemptId?: string | null;
  type: CertificateType;
  title: string;
  description?: string | null;
  verificationId: string;
  issuedAt: Date;
  expiresAt?: Date | null;
  metadata: Record<string, any>; // JSON
}

/**
 * Data required to generate a new certificate.
 * Used as input for `certificateService.generateCertificate`.
 */
export interface GenerateCertificateData {
  studentId: string;
  enrollmentId?: string;
  examAttemptId?: string;
  type: CertificateType;
  title: string;
  description?: string;
}

/**
 * Represents a certificate as returned from the `getStudentCertificates` method,
 * including contextual information about the related course or exam.
 */
export interface StudentCertificate extends Certificate {
  enrollment?: {
    course: {
      title: string;
      subject: string;
    };
  } | null;
  examAttempt?: {
    quiz: {
      title:string;
    };
  } | null;
}

/**
 * The response structure for a successful internal certificate verification request.
 * This is the data structure returned by `certificateService.verifyCertificate`.
 */
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

/**
 * The data embedded within the QR code for a certificate.
 */
export interface CertificateQRData {
  url: string;
  verificationId: string;
  timestamp: string;
}

/**
 * The structure for the public-facing verification result from `verificationService`.
 */
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