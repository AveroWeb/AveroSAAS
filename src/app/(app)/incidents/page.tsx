import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { listIncidents } from "@/lib/queries/incidents";
import { StatusBadge, incidentStatusMeta, incidentPriorityMeta } from "@/components/status-badge";
import { MarkDoneButton } from "@/components/mark-done-button";
import { formatDateTime } from "@/lib/format";
import { resolveIncidentAction } from "@/app/(app)/clients/[id]/actions";

export const metadata: Metadata = { title: "Incidents — Avero Saas" };

export default async function IncidentsPage() {
  const user = await requireStaff();
  const incidents = await listIncidents(user.organizationId);
  const openCount = incidents.filter((i) => i.status === "NEW" || i.status === "IN_PROGRESS").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Incidents</h1>
        <p className="text-sm text-muted-foreground">
          {incidents.length} incident{incidents.length > 1 ? "s" : ""}, dont {openCount} ouvert{openCount > 1 ? "s" : ""}, tous clients confondus.
        </p>
      </div>

      {incidents.length === 0 ? (
        <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          Aucun incident. Ajoutez-en un depuis la fiche d&apos;un client.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {incidents.map((incident) => (
            <div key={incident.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{incident.title}</span>
                  <StatusBadge meta={incidentStatusMeta[incident.status]} />
                  <StatusBadge meta={incidentPriorityMeta[incident.priority]} />
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/clients/${incident.client.id}`} className="text-xs text-muted-foreground hover:underline">
                    {incident.client.companyName}
                    {incident.site ? ` · ${incident.site.name}` : ""} · débuté le {formatDateTime(incident.startedAt)}
                  </Link>
                  {(incident.status === "NEW" || incident.status === "IN_PROGRESS") && (
                    <MarkDoneButton
                      action={resolveIncidentAction.bind(null, incident.client.id, incident.id)}
                      title="Marquer comme résolu"
                    />
                  )}
                </div>
              </div>
              {incident.description && (
                <p className="mt-2 text-sm text-muted-foreground">{incident.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
