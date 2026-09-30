export type NotificationRole =
  | 'STUDENT'
  | 'INSTRUCTOR'
  | 'SCHOOL_ADMIN'
  | 'CORPORATE_CLIENT'
  | 'PLATFORM_ADMIN'
  | 'PARENT';

interface NotificationLike {
  type: string;
  metadata?: Record<string, any> | null;
}

const dashboardFor = (role: NotificationRole): string => {
  switch (role) {
    case 'INSTRUCTOR':
      return '/instructor/dashboard';
    case 'SCHOOL_ADMIN':
      return '/school-admin/dashboard';
    case 'CORPORATE_CLIENT':
      return '/corporate/dashboard';
    case 'PLATFORM_ADMIN':
      return '/admin/dashboard';
    case 'PARENT':
      return '/parents/dashboard';
    default:
      return '/student/dashboard';
  }
};

const metaString = (metadata: Record<string, any> | null | undefined, key: string): string | undefined => {
  const value = metadata?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

/**
 * Maps a notification to the screen a student/admin should land on when they
 * choose "View". Falls back to the role dashboard when there is nothing more
 * specific to open.
 */
export function resolveNotificationLink(notification: NotificationLike, role: NotificationRole): string {
  const { type, metadata } = notification;
  const isStudent = role === 'STUDENT';

  const courseId = metaString(metadata, 'courseId');
  const examId = metaString(metadata, 'examId') ?? metaString(metadata, 'attemptId');
  const eventId = metaString(metadata, 'eventId');
  const jobId = metaString(metadata, 'jobId');
  const ticketId = metaString(metadata, 'ticketId') ?? metaString(metadata, 'supportTicketId');
  const threadId = metaString(metadata, 'threadId');

  switch (type) {
    case 'COURSE_ENROLLMENT':
    case 'PAYMENT_CONFIRMATION':
    case 'PAYMENT_FAILED':
      if (courseId) return isStudent ? `/student/courses/${courseId}` : `/instructor/courses/${courseId}`;
      return dashboardFor(role);

    case 'EXAM_RESULT':
      if (examId) return isStudent ? `/student/exams/${examId}` : `/instructor/exams/${examId}`;
      return isStudent ? '/student/exams' : '/instructor/grading/queue';

    case 'CLASS_REMINDER':
      return isStudent ? '/student/live-classes' : '/instructor/live-classes';

    case 'CERTIFICATE_ISSUED':
      return isStudent ? '/student/certificates' : '/instructor/certificates';

    case 'JOB_APPLICATION':
      return isStudent ? '/student/jobs' : '/corporate/recruitment';

    case 'EVENT_REGISTRATION':
    case 'EVENT_REMINDER':
      return eventId ? `/events?event=${eventId}` : '/events';

    case 'SUPPORT_TICKET':
    case 'SUPPORT_RESPONSE':
      return ticketId
        ? `/student/support?ticket=${ticketId}`
        : isStudent
          ? '/student/support'
          : dashboardFor(role);

    case 'INSTRUCTOR_PAYOUT':
    case 'PAYOUT_PROCESSED':
      return '/instructor/earnings';

    case 'SUBSCRIPTION_RECEIPT':
    case 'SUBSCRIPTION_CANCELLED':
    case 'RENEWAL_REMINDER':
    case 'RENEWAL_FAILED':
      return role === 'PLATFORM_ADMIN' ? '/admin/subscriptions' : dashboardFor(role);

    case 'WELCOME':
    case 'ACCOUNT_VERIFICATION':
    case 'PASSWORD_RESET':
    case 'OTP_VERIFICATION':
      return dashboardFor(role);

    default:
      if (threadId) return '/student/community';
      return dashboardFor(role);
  }
}

const ICON_BY_TYPE: Record<string, string> = {
  COURSE_ENROLLMENT: 'course',
  PAYMENT_CONFIRMATION: 'payment',
  PAYMENT_FAILED: 'payment',
  SUBSCRIPTION_RECEIPT: 'payment',
  RENEWAL_FAILED: 'payment',
  SUBSCRIPTION_CANCELLED: 'payment',
  REFUND_PROCESSED: 'payment',
  EXAM_RESULT: 'exam',
  CLASS_REMINDER: 'event',
  EVENT_REGISTRATION: 'event',
  EVENT_REMINDER: 'event',
  CERTIFICATE_ISSUED: 'certificate',
  INSTRUCTOR_PAYOUT: 'payout',
  PAYOUT_PROCESSED: 'payout',
  SUPPORT_TICKET: 'support',
  SUPPORT_RESPONSE: 'support',
  SYSTEM_ALERT: 'system',
  WELCOME: 'system',
};

export function resolveNotificationIcon(type: string): string {
  return ICON_BY_TYPE[type] ?? 'system';
}