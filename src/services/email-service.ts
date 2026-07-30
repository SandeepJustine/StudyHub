import prisma from '@/lib/utils/prisma';

export class EmailService {
  /**
   * Send an email directly (without NotificationService)
   */
  async sendEmail(payload: {
    to: string;
    subject: string;
    html: string;
  }) {
    try {
      // In production, use nodemailer or SendGrid
      console.log('Sending email:', payload.subject, 'to', payload.to);
      return true;
    } catch (error) {
      console.error('Email send failed:', error);
      return false;
    }
  }

  /**
   * Build and send payment confirmation
   */
  async sendPaymentConfirmation(userId: string, paymentData: {
    amount: number;
    planName: string;
    paymentMethod: string;
    transactionReference: string;
    invoiceUrl?: string;
  }) {
    const user = await this.getUser(userId);
    if (!user?.email) return false;

    return this.sendEmail({
      to: user.email,
      subject: `Payment Confirmed - MWK ${paymentData.amount.toLocaleString()}`,
      html: this.buildPaymentEmail(user.fullName, paymentData),
    });
  }

  /**
   * Build and send OTP
   */
  async sendOTP(userId: string, otp: string, purpose: string) {
    const user = await this.getUser(userId);
    if (!user?.email) return false;

    return this.sendEmail({
      to: user.email,
      subject: 'Your Verification Code',
      html: this.buildOTPEmail(user.fullName, otp, purpose),
    });
  }

  /**
   * Build and send welcome email
   */
  async sendWelcomeEmail(userId: string) {
    const user = await this.getUser(userId);
    if (!user?.email) return false;

    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to StudyHub Malawi!',
      html: this.buildWelcomeEmail(user.fullName),
    });
  }

  /**
   * Build and send exam result
   */
  async sendExamResult(userId: string, examData: {
    quizTitle: string;
    score: number;
    passed: boolean;
  }) {
    const user = await this.getUser(userId);
    if (!user?.email) return false;

    return this.sendEmail({
      to: user.email,
      subject: `Exam Result: ${examData.quizTitle}`,
      html: this.buildExamResultEmail(user.fullName, examData),
    });
  }

  /**
   * Build and send renewal reminder
   */
  async sendRenewalReminder(userId: string, data: {
    tier: string;
    amount: number;
    endDate: Date;
    daysRemaining: number;
  }) {
    const user = await this.getUser(userId);
    if (!user?.email) return false;

    return this.sendEmail({
      to: user.email,
      subject: `Subscription Renewing in ${data.daysRemaining} Days`,
      html: this.buildRenewalEmail(user.fullName, data),
    });
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(userId: string, token: string) {
    const user = await this.getUser(userId);
    if (!user?.email) return false;

    const link = `${process.env.NEXT_PUBLIC_URL}/auth/verify-email?token=${token}`;

    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      html: this.buildVerificationEmail(user.fullName, link),
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userId: string, token: string) {
    const user = await this.getUser(userId);
    if (!user?.email) return false;

    const link = `${process.env.NEXT_PUBLIC_URL}/auth/reset-password?token=${token}`;

    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: this.buildPasswordResetEmail(user.fullName, link),
    });
  }

  async sendTeacherInvitation(userId: string, institutionName: string, resetToken: string) {
    const user = await this.getUser(userId);
    if (!user?.email) return false;

    const link = `${process.env.NEXT_PUBLIC_URL}/auth/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to: user.email,
      subject: `You've been invited to teach at ${institutionName}`,
      html: this.buildTeacherInvitationEmail(user.fullName, institutionName, link),
    });
  }

  // ============ Private Helpers ============

  private async getUser(userId: string) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true },
      });
    } catch {
      return null;
    }
  }

  private buildPaymentEmail(name: string, data: any) {
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2 style="color:#0D1B3D">Payment Confirmed! 🎉</h2><p>Dear ${name},</p><p>Your payment of <strong>MWK ${data.amount.toLocaleString()}</strong> for <strong>${data.planName}</strong> has been confirmed.</p><p>Reference: ${data.transactionReference}</p></div></div>`;
  }

  private buildOTPEmail(name: string, otp: string, purpose: string) {
    return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px;text-align:center"><h2>Verification Code</h2><p>Hello ${name},</p><p>Use this code to ${purpose}:</p><div style="background:#0D1B3D;padding:20px;border-radius:8px;margin:20px 0"><span style="font-size:36px;font-weight:bold;color:#fff;letter-spacing:8px">${otp}</span></div></div></div>`;
  }

  private buildWelcomeEmail(name: string) {
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2>Welcome, ${name}! 🎉</h2><p>Your account is ready. Start your learning journey today!</p></div></div>`;
  }

  private buildExamResultEmail(name: string, data: any) {
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2>Exam Result: ${data.quizTitle}</h2><p>Dear ${name},</p><p>Score: <strong>${data.score}%</strong></p><p>${data.passed ? '🎉 Passed!' : '💪 Keep practicing!'}</p></div></div>`;
  }

  private buildRenewalEmail(name: string, data: any) {
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2>Subscription Renewing Soon</h2><p>Dear ${name},</p><p>Your ${data.tier} plan renews in ${data.daysRemaining} days.</p></div></div>`;
  }

  private buildVerificationEmail(name: string, link: string) {
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2>Verify Your Email</h2><p>Dear ${name},</p><a href="${link}" style="display:inline-block;background:#E63946;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Verify Email</a></div></div>`;
  }

  private buildPasswordResetEmail(name: string, link: string) {
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2>Password Reset</h2><p>Dear ${name},</p><a href="${link}" style="display:inline-block;background:#E63946;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px">Reset Password</a></div></div>`;
  }

  private buildTeacherInvitationEmail(name: string, institutionName: string, link: string) {
    return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden"><div style="background:#0D1B3D;padding:20px;text-align:center"><h1 style="color:#fff;margin:0">StudyHub Malawi</h1></div><div style="padding:30px"><h2>Welcome to ${institutionName}! 🎉</h2><p>Dear ${name},</p><p>You have been invited to join <strong>${institutionName}</strong> as a teacher on StudyHub Malawi. Your account has been created and you can now access the instructor portal.</p><p>Click the button below to set your password and get started:</p><a href="${link}" style="display:inline-block;background:#E63946;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin:20px 0">Set Your Password</a><p>Once you set your password, you can log in at <strong>${process.env.NEXT_PUBLIC_URL}/auth/login</strong> with your email address.</p><p>Your role: <strong>Instructor</strong></p><p>If you have any questions, please contact your institution administrator.</p></div></div>`;
  }
}

export const emailService = new EmailService();