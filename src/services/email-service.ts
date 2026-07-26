// src/lib/email/email-service.ts
import { NotificationService } from '@/lib/notifications/notification-service';

export class EmailService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async sendPaymentConfirmation(userId: string, paymentData: {
    amount: number;
    planName: string;
    paymentMethod: string;
    transactionReference: string;
    invoiceUrl?: string;
  }) {
    await this.notificationService.send({
      userId,
      type: 'PAYMENT_CONFIRMATION',
      title: `Payment Confirmed - MWK ${paymentData.amount.toLocaleString()}`,
      message: `Your payment of MWK ${paymentData.amount.toLocaleString()} for ${paymentData.planName} has been confirmed.`,
      channel: ['EMAIL', 'PUSH'], // Email primary, Push for in-app
      priority: 'normal',
      metadata: {
        ...paymentData,
        userName: await this.getUserName(userId),
        template: 'payment-confirmation',
      },
    });
  }

  async sendOTP(userId: string, otp: string, purpose: string) {
    await this.notificationService.send({
      userId,
      type: 'OTP_VERIFICATION',
      title: 'Your Verification Code',
      message: `Your verification code is: ${otp}. It expires in 10 minutes.`,
      channel: ['EMAIL', 'SMS'], // Both email and SMS for OTP (time-sensitive)
      priority: 'high',
      metadata: {
        otp,
        purpose,
        expiryMinutes: 10,
        template: 'otp-verification',
      },
    });
  }

  async sendWelcomeEmail(userId: string, role: string) {
    const features = this.getFeaturesByRole(role);

    await this.notificationService.send({
      userId,
      type: 'WELCOME',
      title: 'Welcome to StudyHub Malawi!',
      message: 'Welcome to StudyHub! Your account is ready. Start your learning journey today.',
      channel: ['EMAIL'], // Welcome email only
      priority: 'normal',
      metadata: {
        role,
        features,
        template: 'welcome',
      },
    });
  }

  async sendSubscriptionReceipt(userId: string, subscriptionData: {
    tier: string;
    amount: number;
    period: string;
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
  }) {
    await this.notificationService.send({
      userId,
      type: 'SUBSCRIPTION_RECEIPT',
      title: 'Subscription Receipt',
      message: `Your ${subscriptionData.tier} subscription has been activated.`,
      channel: ['EMAIL'],
      priority: 'normal',
      metadata: {
        ...subscriptionData,
        template: 'subscription-receipt',
      },
    });
  }

  async sendExamResult(userId: string, examData: {
    quizTitle: string;
    score: number;
    passed: boolean;
    certificateUrl?: string;
  }) {
    await this.notificationService.send({
      userId,
      type: 'EXAM_RESULT',
      title: `Exam Result: ${examData.quizTitle}`,
      message: `You scored ${examData.score}% - ${examData.passed ? 'Passed! 🎉' : 'Keep practicing! 💪'}`,
      channel: ['EMAIL', 'PUSH'],
      priority: 'normal',
      metadata: {
        ...examData,
        template: 'exam-result',
      },
    });
  }

  async sendRenewalReminder(userId: string, subscriptionData: {
    tier: string;
    amount: number;
    endDate: Date;
    daysRemaining: number;
  }) {
    await this.notificationService.send({
      userId,
      type: 'RENEWAL_REMINDER',
      title: `Subscription Renewing in ${subscriptionData.daysRemaining} Days`,
      message: `Your ${subscriptionData.tier} subscription will renew on ${subscriptionData.endDate.toLocaleDateString()}.`,
      channel: ['EMAIL'], // Email for reminders (cost-effective)
      priority: subscriptionData.daysRemaining <= 3 ? 'high' : 'normal',
      metadata: {
        ...subscriptionData,
        template: 'renewal-reminder',
      },
    });
  }

  private async getUserName(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });
    return user?.fullName || 'Student';
  }

  private getFeaturesByRole(role: string) {
    const features = {
      STUDENT: [
        { icon: '📚', title: 'Video Lessons', description: 'Learn from expert instructors' },
        { icon: '📝', title: 'Practice Quizzes', description: 'Test your knowledge' },
        { icon: '🎓', title: 'Mock Exams', description: 'Prepare for real exams' },
        { icon: '💬', title: 'Community', description: 'Connect with other learners' },
      ],
      INSTRUCTOR: [
        { icon: '🎥', title: 'Create Courses', description: 'Share your knowledge' },
        { icon: '💰', title: 'Earn Revenue', description: 'Get paid for your courses' },
        { icon: '📊', title: 'Track Progress', description: 'Monitor student performance' },
        { icon: '👥', title: 'Build Audience', description: 'Grow your student base' },
      ],
      SCHOOL_ADMIN: [
        { icon: '🏫', title: 'Manage School', description: 'Oversee your institution' },
        { icon: '👩‍🎓', title: 'Track Students', description: 'Monitor progress' },
        { icon: '📈', title: 'Analytics', description: 'Data-driven insights' },
        { icon: '⚙️', title: 'Customize', description: 'Brand your portal' },
      ],
    };

    return features[role] || features.STUDENT;
  }
}