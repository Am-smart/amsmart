/**
 * Push notifications service.
 *
 * The legacy implementation used `web-push`, which needs Node-native bindings
 * and does NOT run in the Cloudflare Worker runtime that hosts TanStack Start
 * server functions on Lovable. This is a Worker-safe no-op stub that
 * preserves the public surface (`sendNotification`, `sendToMany`,
 * `resolveLink`) so the rest of the service layer compiles and runs.
 * Replace with a fetch-based Web Push or FCM/OneSignal provider to enable
 * delivery.
 */
import type { PushSubscription } from "../types";

type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
};

export class PushService {
  resolveLink(link?: string): string {
    if (!link) return "/";
    if (link.startsWith("http")) return link;
    const [type, id] = link.split(":");
    switch (type) {
      case "course": return `/student/courses?id=${id}`;
      case "assignment": return `/student/assignments?id=${id}`;
      case "quiz": return `/student/quizzes?id=${id}`;
      case "live": return `/student/live-class?id=${id}`;
      case "grading": return `/teacher/grading?id=${id}`;
      default: return link.startsWith("/") ? link : `/${link}`;
    }
  }

  async sendNotification(_s: PushSubscription, _p: PushPayload): Promise<{ ok: boolean; reason?: string }> {
    return { ok: false, reason: "push-disabled" };
  }

  async sendToMany(subs: PushSubscription[], p: PushPayload): Promise<Array<{ ok: boolean; reason?: string }>> {
    return Promise.all(subs.map((s) => this.sendNotification(s, p)));
  }
}

export const pushService = new PushService();