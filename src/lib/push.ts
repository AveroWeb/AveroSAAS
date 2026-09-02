import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not configured.");
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@averoweb.fr",
    publicKey,
    privateKey,
  );
  configured = true;
}

/** Sends a push notification to every subscribed device for the given organization. */
export async function sendPushToOrganization(
  organizationId: string,
  payload: { title: string; body: string; url?: string },
) {
  ensureConfigured();

  const subscriptions = await prisma.pushSubscription.findMany({ where: { organizationId } });
  if (subscriptions.length === 0) return;

  const data = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          data,
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        // 404/410 = the browser dropped the subscription (uninstalled, expired, etc).
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );
}
