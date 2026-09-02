import { prisma } from "@/lib/prisma";

export async function listEmailAccounts(organizationId: string) {
  return prisma.emailAccount.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}

export async function listEmails(
  organizationId: string,
  options?: { accountId?: string; unreadOnly?: boolean },
) {
  return prisma.email.findMany({
    where: {
      organizationId,
      accountId: options?.accountId,
      isRead: options?.unreadOnly ? false : undefined,
    },
    include: { account: { select: { id: true, label: true, emailAddress: true } } },
    orderBy: { receivedAt: "desc" },
  });
}

export async function getEmail(organizationId: string, emailId: string) {
  return prisma.email.findFirst({
    where: { id: emailId, organizationId },
    include: { account: { select: { id: true, label: true, emailAddress: true } } },
  });
}

export async function countUnreadEmails(organizationId: string) {
  return prisma.email.count({ where: { organizationId, isRead: false } });
}
