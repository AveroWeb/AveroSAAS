import { prisma } from "@/lib/prisma";

export async function listClients(organizationId: string, query?: string) {
  const trimmed = query?.trim();

  return prisma.client.findMany({
    where: {
      organizationId,
      ...(trimmed
        ? {
            OR: [
              { companyName: { contains: trimmed, mode: "insensitive" } },
              { contactName: { contains: trimmed, mode: "insensitive" } },
              { email: { contains: trimmed, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      _count: {
        select: {
          sites: true,
          incidents: { where: { status: { in: ["NEW", "IN_PROGRESS"] } } },
        },
      },
      subscriptions: {
        where: { status: "ACTIVE" },
        select: { monthlyPrice: true },
      },
    },
    orderBy: { companyName: "asc" },
  });
}

export type ClientListItem = Awaited<ReturnType<typeof listClients>>[number];

export async function getClientDetail(organizationId: string, clientId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, organizationId },
    include: {
      sites: { orderBy: { createdAt: "desc" } },
      domains: { orderBy: { expiresAt: "asc" }, include: { site: true } },
      hostings: { orderBy: { renewsAt: "asc" }, include: { site: true } },
      tools: { orderBy: { name: "asc" }, include: { site: true } },
      subscriptions: { include: { plan: true }, orderBy: { startDate: "desc" } },
      invoices: { include: { subscription: { include: { plan: true } } }, orderBy: { issueDate: "desc" } },
      quotes: { include: { invoice: true }, orderBy: { issueDate: "desc" } },
      maintenanceTasks: {
        orderBy: { nextRunAt: "asc" },
        include: { site: true, assignee: true },
      },
      incidents: {
        orderBy: { startedAt: "desc" },
        include: { site: true, events: { orderBy: { createdAt: "asc" } } },
      },
      tasks: { orderBy: { dueDate: "asc" }, include: { site: true, assignee: true } },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 30, include: { user: true } },
    },
  });
}

export type ClientDetail = NonNullable<Awaited<ReturnType<typeof getClientDetail>>>;
