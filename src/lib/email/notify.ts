import { prisma } from "@/lib/prisma";
import { sendPushToOrganization } from "@/lib/push";
import type { SyncedEmailSummary } from "@/lib/email/imap";

/** Creates a Notification row per new email and pushes a browser notification for each. */
export async function notifyNewEmails(organizationId: string, emails: SyncedEmailSummary[]) {
  if (emails.length === 0) return;

  await prisma.notification.createMany({
    data: emails.map((email) => ({
      organizationId,
      type: "NEW_EMAIL" as const,
      title: "Nouvel email",
      message: `${email.fromName || email.fromAddress} — ${email.subject}`,
      link: `/emails/${email.id}`,
    })),
  });

  if (emails.length === 1) {
    const email = emails[0];
    await sendPushToOrganization(organizationId, {
      title: `Nouvel email de ${email.fromName || email.fromAddress}`,
      body: email.subject,
      url: `/emails/${email.id}`,
    });
  } else {
    await sendPushToOrganization(organizationId, {
      title: `${emails.length} nouveaux emails`,
      body: emails.map((e) => e.subject).slice(0, 3).join(" • "),
      url: "/emails",
    });
  }
}
