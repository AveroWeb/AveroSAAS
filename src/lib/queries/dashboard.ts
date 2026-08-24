import { startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export async function getDashboardOverview(organizationId: string) {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    activeClients,
    totalSites,
    offlineSites,
    mrrAgg,
    hostingCostAgg,
    domainCostAgg,
    toolCostAgg,
    pendingMaintenanceCount,
    expiringDomainsCount,
    expiringHostingsCount,
    unpaidInvoicesCount,
  ] = await Promise.all([
    prisma.client.count({ where: { organizationId, status: "ACTIVE" } }),
    prisma.site.count({ where: { organizationId } }),
    prisma.site.count({ where: { organizationId, status: "OFFLINE" } }),
    prisma.subscription.aggregate({
      where: { organizationId, status: "ACTIVE" },
      _sum: { monthlyPrice: true },
    }),
    prisma.hosting.aggregate({ where: { organizationId }, _sum: { monthlyCost: true } }),
    prisma.domain.aggregate({ where: { organizationId }, _sum: { annualCost: true } }),
    prisma.tool.aggregate({ where: { organizationId }, _sum: { monthlyCost: true } }),
    prisma.maintenanceTask.count({ where: { organizationId, status: "PENDING" } }),
    prisma.domain.count({
      where: { organizationId, expiresAt: { gte: now, lte: in30Days } },
    }),
    prisma.hosting.count({
      where: { organizationId, renewsAt: { gte: now, lte: in30Days } },
    }),
    prisma.invoice.count({ where: { organizationId, status: "UNPAID" } }),
  ]);

  const [
    offlineSitesList,
    expiringDomainsList,
    expiringHostingsList,
    lateMaintenanceList,
    unpaidInvoicesList,
    urgentTasks,
    todayTasks,
    lateTasks,
  ] = await Promise.all([
    prisma.site.findMany({
      where: { organizationId, status: "OFFLINE" },
      include: { client: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.domain.findMany({
      where: { organizationId, expiresAt: { gte: now, lte: in30Days } },
      include: { client: true },
      orderBy: { expiresAt: "asc" },
      take: 5,
    }),
    prisma.hosting.findMany({
      where: { organizationId, renewsAt: { gte: now, lte: in30Days } },
      include: { client: true },
      orderBy: { renewsAt: "asc" },
      take: 5,
    }),
    prisma.maintenanceTask.findMany({
      where: { organizationId, status: "PENDING", nextRunAt: { lt: now } },
      include: { client: true, site: true },
      orderBy: { nextRunAt: "asc" },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { organizationId, status: "UNPAID" },
      include: { client: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        organizationId,
        status: { notIn: ["DONE"] },
        priority: { in: ["URGENT", "HIGH"] },
      },
      include: { client: true },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
    prisma.task.findMany({
      where: {
        organizationId,
        status: { notIn: ["DONE"] },
        dueDate: { gte: todayStart, lte: todayEnd },
      },
      include: { client: true },
      orderBy: { priority: "desc" },
      take: 6,
    }),
    prisma.task.findMany({
      where: {
        organizationId,
        status: { notIn: ["DONE"] },
        dueDate: { lt: todayStart },
      },
      include: { client: true },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
  ]);

  const mrr = toNumber(mrrAgg._sum.monthlyPrice);
  const monthlyCosts =
    toNumber(hostingCostAgg._sum.monthlyCost) +
    toNumber(domainCostAgg._sum.annualCost) / 12 +
    toNumber(toolCostAgg._sum.monthlyCost);
  const margin = mrr - monthlyCosts;

  return {
    kpis: {
      activeClients,
      totalSites,
      offlineSites,
      mrr,
      monthlyCosts,
      margin,
      pendingMaintenanceCount,
      expiringDomainsCount,
      expiringHostingsCount,
      unpaidInvoicesCount,
    },
    alerts: {
      offlineSites: offlineSitesList,
      expiringDomains: expiringDomainsList,
      expiringHostings: expiringHostingsList,
      lateMaintenance: lateMaintenanceList,
      unpaidInvoices: unpaidInvoicesList,
    },
    tasks: {
      urgent: urgentTasks,
      today: todayTasks,
      late: lateTasks,
    },
  };
}

export type DashboardOverview = Awaited<ReturnType<typeof getDashboardOverview>>;
