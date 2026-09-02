import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/session";
import { getClientDetail } from "@/lib/queries/clients";
import { listPlans } from "@/lib/queries/subscriptions";
import { getOrganizationBilling } from "@/lib/queries/organization";
import { StatusBadge, clientStatusMeta } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { computeClientFinancials, computeClientTimeline } from "@/lib/client-overview";
import { serializeClientDetail } from "@/lib/serialize-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { ClientDetailTabs } from "./client-detail-tabs";
import { deleteClientAction } from "../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const user = await requireStaff();
  const { id } = await params;
  const client = await getClientDetail(user.organizationId, id);
  return { title: client ? `${client.companyName} — Avero Saas` : "Client — Avero Saas" };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const [client, plans, billing] = await Promise.all([
    getClientDetail(user.organizationId, id),
    listPlans(user.organizationId),
    getOrganizationBilling(user.organizationId),
  ]);
  if (!client) notFound();

  const financials = computeClientFinancials(client);
  const timeline = computeClientTimeline(client);
  const activeSubscription = client.subscriptions.find((s) => s.status === "ACTIVE");
  const openIncidents = client.incidents.filter((i) => i.status === "NEW" || i.status === "IN_PROGRESS").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{client.companyName}</h1>
            <StatusBadge meta={clientStatusMeta[client.status]} />
          </div>
          {client.contactName && (
            <p className="text-sm text-muted-foreground">
              {client.contactName}
              {client.email ? ` · ${client.email}` : ""}
              {client.phone ? ` · ${client.phone}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href={`/clients/${client.id}/edit`} />} nativeButton={false}>
            <Pencil />
            Modifier
          </Button>
          <DeleteButton
            action={deleteClientAction.bind(null, client.id)}
            confirmMessage={`Supprimer le client « ${client.companyName} » ? Ses sites, devis, factures, abonnements et incidents seront aussi supprimés. Cette action est irréversible.`}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewStat label="Forfait actuel" value={activeSubscription?.plan?.name ?? "Aucun"} />
        <OverviewStat label="MRR" value={formatCurrency(financials.mrr)} />
        <OverviewStat
          label="Marge estimée / mois"
          value={formatCurrency(financials.margin)}
          tone={financials.margin >= 0 ? "success" : "danger"}
        />
        <OverviewStat label="Sites" value={String(client.sites.length)} />
        <OverviewStat label="Dernière maintenance" value={formatDate(timeline.lastMaintenance)} />
        <OverviewStat label="Dernier incident" value={formatDate(timeline.lastIncident)} />
        <OverviewStat label="Prochaine échéance" value={formatDate(timeline.nextDeadline)} />
        <OverviewStat
          label="Incidents ouverts"
          value={String(openIncidents)}
          tone={openIncidents > 0 ? "danger" : "default"}
        />
      </div>

      <ClientDetailTabs
        client={serializeClientDetail(client)}
        financials={financials}
        plans={plans.map((p) => ({ id: p.id, name: p.name, monthlyPrice: Number(p.monthlyPrice) }))}
        vatEnabled={billing?.vatEnabled ?? true}
        vatRate={billing?.vatRate ?? 20}
      />
    </div>
  );
}

function OverviewStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "danger"
        ? "text-red-600 dark:text-red-400"
        : "";

  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
