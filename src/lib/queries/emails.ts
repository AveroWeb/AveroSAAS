import { prisma } from "@/lib/prisma";

export async function listEmailAccounts(organizationId: string) {
  return prisma.emailAccount.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
  });
}

export type EmailSort = "date_desc" | "date_asc" | "sender" | "unread";
export type EmailFilter = "all" | "unread" | "starred";

export async function listEmails(
  organizationId: string,
  options?: { accountId?: string; filter?: EmailFilter; sort?: EmailSort },
) {
  const filter = options?.filter ?? "all";
  const sort = options?.sort ?? "date_desc";

  return prisma.email.findMany({
    where: {
      organizationId,
      accountId: options?.accountId,
      isRead: filter === "unread" ? false : undefined,
      isStarred: filter === "starred" ? true : undefined,
    },
    include: { account: { select: { id: true, label: true, emailAddress: true } } },
    orderBy:
      sort === "date_asc"
        ? { receivedAt: "asc" }
        : sort === "sender"
          ? [{ fromName: "asc" }, { fromAddress: "asc" }, { receivedAt: "desc" }]
          : sort === "unread"
            ? [{ isRead: "asc" }, { receivedAt: "desc" }]
            : { receivedAt: "desc" },
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
