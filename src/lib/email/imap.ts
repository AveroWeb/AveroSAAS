import { ImapFlow, type FetchMessageObject } from "imapflow";
import { simpleParser } from "mailparser";
import { convert as htmlToText } from "html-to-text";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";

const MAILBOX_TO_FOLDER = { INBOX: "INBOX" } as const;
const MAX_MESSAGES_PER_SYNC = 100;

export class EmailSyncError extends Error {}

export type SyncedEmailSummary = {
  id: string;
  subject: string;
  fromName: string | null;
  fromAddress: string;
};

/** Connects to an IMAP account, pulls the newest messages, and stores new ones. Returns the newly saved emails. */
export async function syncEmailAccount(accountId: string): Promise<SyncedEmailSummary[]> {
  const account = await prisma.emailAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new EmailSyncError("Compte email introuvable.");
  if (!account.isActive) throw new EmailSyncError("Ce compte email est désactivé.");

  const password = decryptSecret(account.passwordEnc);
  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: account.imapSecure,
    auth: { user: account.username, pass: password },
    logger: false,
  });

  const savedEmails: SyncedEmailSummary[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock(MAILBOX_TO_FOLDER.INBOX);
    try {
      const status = await client.status(MAILBOX_TO_FOLDER.INBOX, { messages: true });
      const total = status.messages ?? 0;

      if (total > 0) {
        const startSeq = Math.max(1, total - MAX_MESSAGES_PER_SYNC + 1);
        const range = `${startSeq}:*`;

        const existingUids = new Set(
          (
            await prisma.email.findMany({
              where: { accountId, folder: "INBOX" },
              select: { uid: true },
            })
          ).map((e) => e.uid),
        );

        for await (const message of client.fetch(range, {
          uid: true,
          envelope: true,
          source: true,
        }) as AsyncIterable<FetchMessageObject>) {
          if (!message.uid || existingUids.has(message.uid)) continue;
          if (!message.source) continue;

          const parsed = await simpleParser(message.source);
          const from = parsed.from?.value?.[0];
          const toList = Array.isArray(parsed.to) ? parsed.to : parsed.to ? [parsed.to] : [];
          const toAddresses = toList
            .flatMap((t) => t.value.map((v) => v.address).filter(Boolean))
            .join(", ");

          const bodyHtml = typeof parsed.html === "string" ? parsed.html : null;
          const bodyText = parsed.text ?? (bodyHtml ? htmlToText(bodyHtml) : null);

          const created = await prisma.email.create({
            data: {
              organizationId: account.organizationId,
              accountId: account.id,
              uid: message.uid,
              folder: "INBOX",
              messageId: parsed.messageId ?? null,
              fromName: from?.name || null,
              fromAddress: from?.address ?? "inconnu",
              toAddresses: toAddresses || account.emailAddress,
              subject: parsed.subject || "(sans objet)",
              bodyText,
              bodyHtml,
              receivedAt: parsed.date ?? new Date(),
            },
          });
          savedEmails.push({
            id: created.id,
            subject: created.subject,
            fromName: created.fromName,
            fromAddress: created.fromAddress,
          });
        }
      }
    } finally {
      lock.release();
    }

    await prisma.emailAccount.update({
      where: { id: accountId },
      data: { lastSyncedAt: new Date(), lastSyncError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de synchronisation inconnue.";
    await prisma.emailAccount.update({
      where: { id: accountId },
      data: { lastSyncError: message },
    });
    throw new EmailSyncError(message);
  } finally {
    try {
      await client.logout();
    } catch {
      // connection may already be closed
    }
  }

  return savedEmails;
}

/** Verifies IMAP credentials by connecting and immediately logging out. Throws on failure. */
export async function testImapConnection(params: {
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  username: string;
  password: string;
}) {
  const client = new ImapFlow({
    host: params.imapHost,
    port: params.imapPort,
    secure: params.imapSecure,
    auth: { user: params.username, pass: params.password },
    logger: false,
  });
  try {
    await client.connect();
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore
    }
  }
}
