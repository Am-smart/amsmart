import webpush from 'web-push';
import { PushSubscription } from '../types';

// VAPID keys should be generated only once.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@smartlms.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export class PushService {
  /**
   * Resolves internal link format to full application paths.
   */
  resolveLink(link?: string): string {
    if (!link) return '/';
    if (link.startsWith('http')) return link;

    const [type, id] = link.split(':');
    switch (type) {
      case 'course': return `/student/courses?id=${id}`;
      case 'assignment': return `/student/assignments?id=${id}`;
      case 'quiz': return `/student/quizzes?id=${id}`;
      case 'live': return `/student/live-class?id=${id}`;
      case 'grading': return `/teacher/grading?id=${id}`;
      default: return link.startsWith('/') ? link : `/${link}`;
    }
  }

  /**
   * Sends a push notification to a specific subscription.
   */
  async sendNotification(subscription: PushSubscription, payload: { title: string, body: string, icon?: string, tag?: string, data?: Record<string, unknown> }) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn('PushService: VAPID keys not configured, skipping push notification.');
      return;
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    try {
      const pushPayload = {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/window.svg',
        tag: payload.tag,
        data: {
          ...payload.data,
          url: this.resolveLink((payload.data?.url as string) || (payload.data?.link as string))
        }
      };

      await webpush.sendNotification(pushSubscription, JSON.stringify(pushPayload));
      return { success: true };
    } catch (error: unknown) {
      console.error('PushService: Failed to send notification', error);
      const err = error as { statusCode?: number; message?: string };

      // If the subscription is no longer valid, we should return an error so the caller can clean it up
      if (err.statusCode === 404 || err.statusCode === 410) {
        return { success: false, expired: true, error: err.message };
      }

      return { success: false, error: err.message };
    }
  }

  /**
   * Sends notifications to multiple subscriptions.
   */
  async sendToMany(subscriptions: PushSubscription[], payload: { title: string, body: string, icon?: string, tag?: string, data?: Record<string, unknown> }) {
    const results = await Promise.all(
      subscriptions.map(sub => this.sendNotification(sub, payload))
    );
    return results;
  }
}

export const pushService = new PushService();
