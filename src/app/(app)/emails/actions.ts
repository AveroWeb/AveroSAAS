"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireStaff } from "@/lib/session";
import { encryptSecret } from "@/lib/crypto";
import { emailAccountSchema } from "@/lib/validation/email-account";
import { syncEmailAccount, testImapConnection, EmailSyncError } from "@/lib/email/imap";
import { notifyNewEmails } from "@/lib/email/notify";

export async function createEmailAccountAction(formData: FormData) {
  const user = await requireAdmin();

  let data;
  try {
    data = emailAccountSchema.parse(Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof z.ZodError) throw new Error(error.issues[0]?.message ?? "Données invalides.");
    throw error;
  }

  const imapSecure = data.imapSecure === "on";

  try {
    await testImapConnection({
      imapHost: data.imapHost,
      imapPort: data.imapPort,
      imapSecure,
      username: data.username,
      password: data.password,
    });
  } catch (error) {
    console.error("[emails] IMAP connection test failed:", error);
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Connexion IMAP impossible : ${detail}`);
  }

  const account = await prisma.emailAccount.create({
    data: {
      organizationId: user.organizationId,
      label: data.label,
      emailAddress: data.emailAddress,
      imapHost: data.imapHost,
      imapPort: data.imapPort,
      imapSecure,
      username: data.username,
      passwordEnc: encryptSecret(data.password),
    },
  });

  try {
    const newEmails = await syncEmailAccount(account.id);
    await notifyNewEmails(user.organizationId, newEmails);
  } catch {
    // Account is saved even if the first sync fails; user can retry from the inbox.
  }

  revalidatePath("/emails");
  revalidatePath("/settings");
}

export async function deleteEmailAccountAction(accountId: string) {
  const user = await requireAdmin();
  const account = await prisma.emailAccount.findFirst({
    where: { id: accountId, organizationId: user.organizationId },
  });
  if (!account) throw new Error("Compte introuvable.");

  await prisma.emailAccount.delete({ where: { id: accountId } });
  revalidatePath("/emails");
  revalidatePath("/settings");
}

export async function syncEmailAccountAction(accountId: string) {
  const user = await requireStaff();
  const account = await prisma.emailAccount.findFirst({
    where: { id: accountId, organizationId: user.organizationId },
  });
  if (!account) throw new Error("Compte introuvable.");

  try {
    const newEmails = await syncEmailAccount(accountId);
    await notifyNewEmails(user.organizationId, newEmails);
  } catch (error) {
    if (error instanceof EmailSyncError) throw new Error(error.message);
    throw error;
  }

  revalidatePath("/emails");
}

export async function syncAllEmailAccountsAction() {
  const user = await requireStaff();
  const accounts = await prisma.emailAccount.findMany({
    where: { organizationId: user.organizationId, isActive: true },
  });

  const results = await Promise.allSettled(accounts.map((account) => syncEmailAccount(account.id)));
  const newEmails = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  await notifyNewEmails(user.organizationId, newEmails);
  revalidatePath("/emails");
}

export async function markEmailReadAction(emailId: string, isRead: boolean) {
  const user = await requireStaff();
  const email = await prisma.email.findFirst({
    where: { id: emailId, organizationId: user.organizationId },
  });
  if (!email) throw new Error("Email introuvable.");

  await prisma.email.update({ where: { id: emailId }, data: { isRead } });
  revalidatePath("/emails");
  revalidatePath(`/emails/${emailId}`);
}

export async function deleteEmailsAction(emailIds: string[]) {
  const user = await requireStaff();
  if (emailIds.length === 0) return;

  await prisma.email.deleteMany({
    where: { id: { in: emailIds }, organizationId: user.organizationId },
  });
  revalidatePath("/emails");
}

export async function setEmailsReadAction(emailIds: string[], isRead: boolean) {
  const user = await requireStaff();
  if (emailIds.length === 0) return;

  await prisma.email.updateMany({
    where: { id: { in: emailIds }, organizationId: user.organizationId },
    data: { isRead },
  });
  revalidatePath("/emails");
}

export async function toggleEmailStarAction(emailId: string, isStarred: boolean) {
  const user = await requireStaff();
  const email = await prisma.email.findFirst({
    where: { id: emailId, organizationId: user.organizationId },
  });
  if (!email) throw new Error("Email introuvable.");

  await prisma.email.update({ where: { id: emailId }, data: { isStarred } });
  revalidatePath("/emails");
  revalidatePath(`/emails/${emailId}`);
}

export async function linkEmailToClientAction(emailId: string, clientId: string | null) {
  const user = await requireStaff();
  const email = await prisma.email.findFirst({
    where: { id: emailId, organizationId: user.organizationId },
  });
  if (!email) throw new Error("Email introuvable.");

  if (clientId) {
    const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: user.organizationId } });
    if (!client) throw new Error("Client introuvable.");
  }

  await prisma.email.update({ where: { id: emailId }, data: { clientId } });
  revalidatePath(`/emails/${emailId}`);
}

export async function subscribeToPushAction(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const user = await requireStaff();

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      organizationId: user.organizationId,
      userId: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      userId: user.id,
      organizationId: user.organizationId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function unsubscribeFromPushAction(endpoint: string) {
  await requireStaff();
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}
