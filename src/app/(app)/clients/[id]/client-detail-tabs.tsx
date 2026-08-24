"use client";

import { Globe, Link2, Server, Wrench as ToolIcon, CalendarClock, AlertTriangle, ListChecks, StickyNote, History, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  StatusBadge,
  siteStatusMeta,
  siteTypeMeta,
  siteEnvironmentMeta,
  domainStatusMeta,
  incidentStatusMeta,
  incidentPriorityMeta,
  maintenanceStatusMeta,
  taskStatusMeta,
  taskPriorityMeta,
} from "@/components/status-badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { SerializedClientDetail } from "@/lib/serialize-client";

type Financials = { hostingCost: number; domainCost: number; toolCost: number; totalCost: number };

export function ClientDetailTabs({
  client,
  financials,
}: {
  client: SerializedClientDetail;
  financials: Financials;
}) {
  return (
    <Tabs defaultValue="sites" className="gap-4">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="sites"><Globe className="size-4" /> Sites ({client.sites.length})</TabsTrigger>
        <TabsTrigger value="domains"><Link2 className="size-4" /> Domaines ({client.domains.length})</TabsTrigger>
        <TabsTrigger value="hosting"><Server className="size-4" /> Hébergement ({client.hostings.length})</TabsTrigger>
        <TabsTrigger value="tools"><ToolIcon className="size-4" /> Outils ({client.tools.length})</TabsTrigger>
        <TabsTrigger value="maintenance"><CalendarClock className="size-4" /> Maintenance ({client.maintenanceTasks.length})</TabsTrigger>
        <TabsTrigger value="incidents"><AlertTriangle className="size-4" /> Incidents ({client.incidents.length})</TabsTrigger>
        <TabsTrigger value="tasks"><ListChecks className="size-4" /> Tâches ({client.tasks.length})</TabsTrigger>
        <TabsTrigger value="notes"><StickyNote className="size-4" /> Notes</TabsTrigger>
        <TabsTrigger value="history"><History className="size-4" /> Historique</TabsTrigger>
      </TabsList>

      <TabsContent value="sites">
        <EmptyableTable empty={client.sites.length === 0} message="Aucun site pour ce client.">
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Environnement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Mise en ligne</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {client.sites.map((site) => (
              <TableRow key={site.id}>
                <TableCell>
                  <a href={site.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium hover:underline">
                    {site.name} <ExternalLink className="size-3 text-muted-foreground" />
                  </a>
                  <span className="block text-xs text-muted-foreground">{site.url}</span>
                </TableCell>
                <TableCell><StatusBadge meta={siteTypeMeta[site.type]} /></TableCell>
                <TableCell><StatusBadge meta={siteEnvironmentMeta[site.environment]} /></TableCell>
                <TableCell><StatusBadge meta={siteStatusMeta[site.status]} /></TableCell>
                <TableCell>{formatDate(site.launchedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </EmptyableTable>
      </TabsContent>

      <TabsContent value="domains">
        <EmptyableTable empty={client.domains.length === 0} message="Aucun domaine pour ce client.">
          <TableHeader>
            <TableRow>
              <TableHead>Domaine</TableHead>
              <TableHead>Registrar</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Renouv. auto</TableHead>
              <TableHead>Coût annuel</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {client.domains.map((domain) => (
              <TableRow key={domain.id}>
                <TableCell>
                  <span className="font-medium">{domain.name}</span>
                  {domain.isPrimary && <span className="ml-2 text-xs text-muted-foreground">principal</span>}
                </TableCell>
                <TableCell>
                  {domain.registrarUrl ? (
                    <a href={domain.registrarUrl} target="_blank" rel="noreferrer" className="hover:underline">
                      {domain.registrar ?? domain.registrarUrl}
                    </a>
                  ) : (
                    domain.registrar ?? "—"
                  )}
                </TableCell>
                <TableCell>{formatDate(domain.expiresAt)}</TableCell>
                <TableCell>{domain.autoRenew ? "Oui" : "Non"}</TableCell>
                <TableCell>{domain.annualCost ? formatCurrency(domain.annualCost) : "—"}</TableCell>
                <TableCell><StatusBadge meta={domainStatusMeta[domain.status]} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </EmptyableTable>
      </TabsContent>

      <TabsContent value="hosting">
        <EmptyableTable empty={client.hostings.length === 0} message="Aucun hébergement pour ce client.">
          <TableHeader>
            <TableRow>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Coût mensuel</TableHead>
              <TableHead>Renouvellement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {client.hostings.map((hosting) => (
              <TableRow key={hosting.id}>
                <TableCell>
                  {hosting.dashboardUrl ? (
                    <a href={hosting.dashboardUrl} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                      {hosting.provider}
                    </a>
                  ) : (
                    <span className="font-medium">{hosting.provider}</span>
                  )}
                </TableCell>
                <TableCell>{hosting.site?.name ?? "—"}</TableCell>
                <TableCell>{hosting.serverType ?? "—"}</TableCell>
                <TableCell>{hosting.monthlyCost ? formatCurrency(hosting.monthlyCost) : "—"}</TableCell>
                <TableCell>{formatDate(hosting.renewsAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </EmptyableTable>
      </TabsContent>

      <TabsContent value="tools">
        <EmptyableTable empty={client.tools.length === 0} message="Aucun outil pour ce client.">
          <TableHeader>
            <TableRow>
              <TableHead>Outil</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Identifiant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {client.tools.map((tool) => (
              <TableRow key={tool.id}>
                <TableCell>
                  {tool.url ? (
                    <a href={tool.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium hover:underline">
                      {tool.name} <ExternalLink className="size-3 text-muted-foreground" />
                    </a>
                  ) : (
                    <span className="font-medium">{tool.name}</span>
                  )}
                </TableCell>
                <TableCell>{tool.category}</TableCell>
                <TableCell>{tool.site?.name ?? "—"}</TableCell>
                <TableCell>{tool.identifier ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </EmptyableTable>
      </TabsContent>

      <TabsContent value="maintenance">
        <EmptyableTable empty={client.maintenanceTasks.length === 0} message="Aucune maintenance planifiée.">
          <TableHeader>
            <TableRow>
              <TableHead>Tâche</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Fréquence</TableHead>
              <TableHead>Prochaine exécution</TableHead>
              <TableHead>Dernière exécution</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {client.maintenanceTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{task.site?.name ?? "—"}</TableCell>
                <TableCell>{frequencyLabel(task.frequency)}</TableCell>
                <TableCell>{formatDate(task.nextRunAt)}</TableCell>
                <TableCell>{formatDate(task.lastRunAt)}</TableCell>
                <TableCell><StatusBadge meta={maintenanceStatusMeta[task.status]} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </EmptyableTable>
      </TabsContent>

      <TabsContent value="incidents">
        {client.incidents.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Aucun incident pour ce client.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {client.incidents.map((incident) => (
              <div key={incident.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{incident.title}</span>
                    <StatusBadge meta={incidentStatusMeta[incident.status]} />
                    <StatusBadge meta={incidentPriorityMeta[incident.priority]} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {incident.site?.name ?? "—"} · débuté le {formatDateTime(incident.startedAt)}
                  </span>
                </div>
                {incident.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{incident.description}</p>
                )}
                {incident.events.length > 0 && (
                  <ol className="mt-3 flex flex-col gap-1.5 border-l pl-4">
                    {incident.events.map((event) => (
                      <li key={event.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{formatDateTime(event.createdAt)}</span> — {event.message}
                      </li>
                    ))}
                  </ol>
                )}
                {(incident.cause || incident.solution) && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {incident.cause && (
                      <div className="text-xs">
                        <span className="font-medium">Cause : </span>
                        <span className="text-muted-foreground">{incident.cause}</span>
                      </div>
                    )}
                    {incident.solution && (
                      <div className="text-xs">
                        <span className="font-medium">Solution : </span>
                        <span className="text-muted-foreground">{incident.solution}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="tasks">
        <EmptyableTable empty={client.tasks.length === 0} message="Aucune tâche pour ce client.">
          <TableHeader>
            <TableRow>
              <TableHead>Tâche</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Responsable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {client.tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell><StatusBadge meta={taskPriorityMeta[task.priority]} /></TableCell>
                <TableCell><StatusBadge meta={taskStatusMeta[task.status]} /></TableCell>
                <TableCell>{formatDate(task.dueDate)}</TableCell>
                <TableCell>{task.assignee?.name ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </EmptyableTable>
      </TabsContent>

      <TabsContent value="notes">
        <div className="rounded-lg border p-4">
          {client.notes ? (
            <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune note interne. Modifiez la fiche client pour en ajouter.
            </p>
          )}
        </div>
        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <span>Hébergement : {formatCurrency(financials.hostingCost)}/mois</span>
          <span>Domaines : {formatCurrency(financials.domainCost)}/mois</span>
          <span>Outils : {formatCurrency(financials.toolCost)}/mois</span>
        </div>
      </TabsContent>

      <TabsContent value="history">
        {client.activityLogs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Aucun historique pour ce client.</p>
        ) : (
          <ol className="flex flex-col gap-3 border-l pl-4">
            {client.activityLogs.map((entry) => (
              <li key={entry.id} className="text-sm">
                <span className="font-medium">{formatDate(entry.createdAt)}</span>
                <span className="text-muted-foreground"> — {entry.message}</span>
              </li>
            ))}
          </ol>
        )}
      </TabsContent>
    </Tabs>
  );
}

function EmptyableTable({
  empty,
  message,
  children,
}: {
  empty: boolean;
  message: string;
  children: React.ReactNode;
}) {
  if (empty) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{message}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="min-w-max">{children}</Table>
    </div>
  );
}

function frequencyLabel(frequency: string) {
  const labels: Record<string, string> = {
    ONCE: "Unique",
    DAILY: "Quotidienne",
    WEEKLY: "Hebdomadaire",
    MONTHLY: "Mensuelle",
    QUARTERLY: "Trimestrielle",
    YEARLY: "Annuelle",
  };
  return labels[frequency] ?? frequency;
}
