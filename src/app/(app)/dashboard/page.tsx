import type { Metadata } from "next";
import { Users, Globe, Euro, TrendingUp, ServerCrash, Wrench, ShieldAlert, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AlertItem, type AlertEntry } from "@/components/dashboard/alert-item";
import { TaskItem } from "@/components/dashboard/task-item";
import { requireStaff } from "@/lib/session";
import { getDashboardOverview } from "@/lib/queries/dashboard";
import { formatCurrency, daysUntil } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard — Mon Agence",
};

export default async function DashboardPage() {
  const user = await requireStaff();
  const data = await getDashboardOverview(user.organizationId);

  const alertEntries: AlertEntry[] = [
    ...data.alerts.offlineSites.map((site) => ({
      id: `site-${site.id}`,
      severity: "red" as const,
      title: `Site hors ligne — ${site.name}`,
      subtitle: site.client.companyName,
      href: `/clients/${site.clientId}`,
    })),
    ...data.alerts.expiringDomains.map((domain) => {
      const days = daysUntil(domain.expiresAt);
      return {
        id: `domain-${domain.id}`,
        severity: (days !== null && days <= 7 ? "red" : "orange") as "red" | "orange",
        title: `Domaine ${domain.name} expire dans ${days} j`,
        subtitle: domain.client.companyName,
        href: `/clients/${domain.clientId}`,
      };
    }),
    ...data.alerts.expiringHostings.map((hosting) => ({
      id: `hosting-${hosting.id}`,
      severity: "orange" as const,
      title: `Hébergement ${hosting.provider} à renouveler`,
      subtitle: hosting.client.companyName,
      href: `/clients/${hosting.clientId}`,
    })),
    ...data.alerts.lateMaintenance.map((task) => ({
      id: `maint-${task.id}`,
      severity: "yellow" as const,
      title: `Maintenance en retard — ${task.title}`,
      subtitle: task.client.companyName,
      href: `/clients/${task.clientId}`,
    })),
    ...data.alerts.unpaidInvoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      severity: "yellow" as const,
      title: `Facture impayée — ${formatCurrency(invoice.amount)}`,
      subtitle: invoice.client.companyName,
      href: `/clients/${invoice.clientId}`,
    })),
  ];

  const allTasks = [...data.tasks.late, ...data.tasks.today, ...data.tasks.urgent].filter(
    (task, index, all) => all.findIndex((t) => t.id === task.id) === index,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          La situation de votre agence en un coup d&apos;œil.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Clients actifs" value={String(data.kpis.activeClients)} icon={Users} />
        <KpiCard title="Sites gérés" value={String(data.kpis.totalSites)} icon={Globe} />
        <KpiCard title="MRR" value={formatCurrency(data.kpis.mrr)} icon={Euro} tone="success" />
        <KpiCard
          title="Marge estimée / mois"
          value={formatCurrency(data.kpis.margin)}
          icon={TrendingUp}
          tone={data.kpis.margin >= 0 ? "success" : "danger"}
        />
        <KpiCard
          title="Sites en panne"
          value={String(data.kpis.offlineSites)}
          icon={ServerCrash}
          tone={data.kpis.offlineSites > 0 ? "danger" : "default"}
        />
        <KpiCard
          title="Maintenances à effectuer"
          value={String(data.kpis.pendingMaintenanceCount)}
          icon={Wrench}
          tone={data.kpis.pendingMaintenanceCount > 0 ? "warning" : "default"}
        />
        <KpiCard
          title="Domaines bientôt expirés"
          value={String(data.kpis.expiringDomainsCount)}
          icon={ShieldAlert}
          tone={data.kpis.expiringDomainsCount > 0 ? "warning" : "default"}
        />
        <KpiCard
          title="Factures impayées"
          value={String(data.kpis.unpaidInvoicesCount)}
          icon={Receipt}
          tone={data.kpis.unpaidInvoicesCount > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>À surveiller</CardTitle>
          </CardHeader>
          <CardContent>
            {alertEntries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Rien à signaler pour le moment.
              </p>
            ) : (
              <div className="flex flex-col">
                {alertEntries.map((entry) => (
                  <AlertItem key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tâches urgentes &amp; du jour</CardTitle>
          </CardHeader>
          <CardContent>
            {allTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucune tâche urgente aujourd&apos;hui.
              </p>
            ) : (
              <div className="flex flex-col">
                {allTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
