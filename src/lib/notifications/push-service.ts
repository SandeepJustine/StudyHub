/**
 * Push notification service for in-app and browser notifications
 */
import { RealtimePushPayload } from '@/types/notification';
import prisma from '@/lib/utils/prisma';

export class PushNotificationService {
  private subscriptions: Map<string, PushSubscription[]> = new Map();
  private vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
  };

  /**
   * Send push notification
   */
  async send(payload: RealtimePushPayload & { userId: string }): Promise<boolean> {
    try {
      // For in-app notifications, emit via WebSocket
      if (global.io) {
        global.io.to(`user:${payload.userId}`).emit('notification', {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          timestamp: new Date().toISOString(),
        });
      }

      // For browser push notifications
      const userSubscriptions = this.subscriptions.get(payload.userId) || [];
      
      if (userSubscriptions.length > 0) {
        const notificationPayload = {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icons/notification-icon.png',
            badge: payload.badge || '/icons/badge.png',
            tag: payload.tag,
            requireInteraction: payload.requireInteraction || false,
            actions: payload.actions,
            data: payload.data,
            vibrate: [200, 100, 200],
          },
        };

        // Send to all user's subscribed devices
        const sendPromises = userSubscriptions.map(subscription =>
          this.sendWebPush(subscription, notificationPayload)
        );

        await Promise.allSettled(sendPromises);
      }

      return true;
    } catch (error) {
      console.error('Push notification failed:', error);
      return false;
    }
  }

  /**
   * Save push subscription for a user
   */
  async saveSubscription(userId: string, subscription: PushSubscription) {
    const userSubs = this.subscriptions.get(userId) || [];
    userSubs.push(subscription);
    this.subscriptions.set(userId, userSubs);

    // In production, save to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Store push subscription info
        metadata: {
          pushSubscription: subscription,
        },
      },
    });
  }

  /**
   * Remove push subscription
   */
  async removeSubscription(userId: string, endpoint: string) {
    const userSubs = this.subscriptions.get(userId) || [];
    const filtered = userSubs.filter(sub => sub.endpoint !== endpoint);
    this.subscriptions.set(userId, filtered);
  }

  /**
   * Send notification to all users (admin broadcast)
   */
  async broadcast(payload: Omit<RealtimePushPayload, 'timestamp'>) {
    const users = await prisma.user.findMany({
      where: {
        notificationPreferences: {
          path: ['pushEnabled'],
          equals: true,
        },
      },
      select: { id: true },
    });

    const timestamp = new Date().toISOString();
    const results = await Promise.allSettled(
      users.map(user => this.send({
        ...payload,
        userId: user.id,
        timestamp, // Add timestamp for RealtimePushPayload
      }))
    );

    return {
      total: users.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
    };
  }

  /**
   * Send via Web Push API
   */
  private async sendWebPush(
    subscription: PushSubscription,
    payload: any
  ): Promise<boolean> {
    try {
      // In production, use web-push library
      // For now, we'll use the fetch API directly
      await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add VAPID headers for authentication
        },
        body: JSON.stringify(payload),
      });

      return true;
    } catch (error) {
      console.error('Web push failed:', error);
      
      // If subscription is invalid, remove it
      if (error.statusCode === 410) {
        // Subscription expired or invalid
      }
      
      return false;
    }
  }
}

export const pushService = new PushNotificationService();