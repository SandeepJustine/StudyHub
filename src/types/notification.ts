import { PaginatedResponse } from './common';

/**
 * Defines the possible types of notifications that can be sent.
 */
export type NotificationType =
  | 'PAYMENT_CONFIRMATION'
  | 'SUBSCRIPTION_RECEIPT'
  | 'SUBSCRIPTION_CANCELLED'
  | 'RENEWAL_REMINDER'
  | 'RENEWAL_FAILED'
  | 'REFUND_PROCESSED'
  | 'OTP_VERIFICATION'
  | 'EXAM_RESULT'
  | 'COURSE_ENROLLMENT'
  | 'COURSE_COMPLETION'
  | 'CLASS_REMINDER'
  | 'CLASS_CANCELLED'
  | 'INSTRUCTOR_PAYOUT'
  | 'WELCOME'
  | 'CERTIFICATE_ISSUED'
  | 'PASSWORD_RESET'
  | 'ACCOUNT_VERIFICATION'
  | 'JOB_APPLICATION'
  | 'EVENT_REGISTRATION'
  | 'EVENT_REMINDER'
  | 'FORUM_REPLY'
  | 'ASSIGNMENT_GRADED'
  | 'SUPPORT_TICKET'
  | 'SUPPORT_RESPONSE'
  | 'PROMOTIONAL';

/**
 * Defines the channels through which a notification can be delivered.
 */
export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH';

/**
 * Defines the priority level of a notification.
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Represents the data structure for a notification record in the database.
 * Aligns with the Prisma Notification model.
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channels: NotificationChannel[];
  status: 'pending' | 'sent' | 'failed' | 'read' | 'scheduled';
  priority: NotificationPriority;
  readAt?: Date | null;
  emailStatus?: 'sent' | 'failed' | 'pending';
  smsStatus?: 'sent' | 'failed' | 'pending';
  pushStatus?: 'sent' | 'failed' | 'pending';
  metadata: Record<string, any>; // JSON
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents the payload for creating and sending a new notification.
 * Used as input for `notificationService.send`.
 */
export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channel?: NotificationChannel | NotificationChannel[];
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  template?: string;
  scheduleFor?: Date;
}

/**
 * Represents a user's notification preferences.
 * This structure is stored in the User model's `notificationPreferences` JSON field.
 */
export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  types: {
    [key in NotificationType]?: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
  };
}

/**
 * Represents the paginated response for a user's notifications.
 */
export type PaginatedUserNotifications = PaginatedResponse<Notification>;

/**
 * Represents the payload for a real-time push notification sent via WebSocket.
 */
export interface RealtimePushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: string;
}