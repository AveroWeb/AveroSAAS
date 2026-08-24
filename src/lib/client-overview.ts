import { toNumber } from "@/lib/format";
import type { ClientDetail } from "@/lib/queries/clients";

export function computeClientFinancials(
  client: Pick<ClientDetail, "subscriptions" | "hostings" | "domains" | "tools">,
) {
  const mrr = client.subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + toNumber(s.monthlyPrice), 0);

  const hostingCost = client.hostings.reduce((sum, h) => sum + toNumber(h.monthlyCost), 0);
  const domainCost = client.domains.reduce((sum, d) => sum + toNumber(d.annualCost) / 12, 0);
  const toolCost = client.tools.reduce((sum, t) => sum + toNumber(t.monthlyCost), 0);
  const totalCost = hostingCost + domainCost + toolCost;
  const margin = mrr - totalCost;

  return { mrr, hostingCost, domainCost, toolCost, totalCost, margin };
}

export function computeClientTimeline(client: ClientDetail) {
  const lastMaintenance =
    client.maintenanceTasks
      .filter((m) => m.lastRunAt)
      .sort((a, b) => b.lastRunAt!.getTime() - a.lastRunAt!.getTime())[0]?.lastRunAt ?? null;

  const lastIncident = client.incidents[0]?.startedAt ?? null;

  const now = Date.now();
  const upcomingDates = [
    ...client.domains.map((d) => d.expiresAt),
    ...client.hostings.map((h) => h.renewsAt),
    ...client.subscriptions.filter((s) => s.status === "ACTIVE").map((s) => s.renewalDate),
    ...client.maintenanceTasks.filter((m) => m.status === "PENDING").map((m) => m.nextRunAt),
  ].filter((date): date is Date => !!date && date.getTime() > now);

  upcomingDates.sort((a, b) => a.getTime() - b.getTime());

  return {
    lastMaintenance,
    lastIncident,
    nextDeadline: upcomingDates[0] ?? null,
  };
}
