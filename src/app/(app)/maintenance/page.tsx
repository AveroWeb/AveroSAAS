import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { listMaintenanceTasks } from "@/lib/queries/maintenance";
import { StatusBadge, maintenanceStatusMeta } from "@/components/status-badge";
import { MarkDoneButton } from "@/components/mark-done-button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { markMaintenanceDoneAction } from "@/app/(app)/clients/[id]/actions";

export const metadata: Metadata = { title: "Maintenance — Avero Saas" };

const FREQUENCY_LABELS: Record<string, string> = {
  ONCE: "Unique",
  DAILY: "Quotidienne",
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuelle",
  QUARTERLY: "Trimestrielle",
  YEARLY: "Annuelle",
};

export default async function MaintenancePage() {
  const user = await requireStaff();
  const tasks = await listMaintenanceTasks(user.organizationId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Maintenance</h1>
        <p className="text-sm text-muted-foreground">
          {tasks.length} tâche{tasks.length > 1 ? "s" : ""} de maintenance, tous clients confondus.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tâche</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Fréquence</TableHead>
                <TableHead>Prochaine exécution</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Aucune maintenance planifiée. Ajoutez-en une depuis la fiche d&apos;un client.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => {
                  const overdue = task.overdue;
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                        <Link href={`/clients/${task.client.id}`} className="hover:underline">
                          {task.client.companyName}
                        </Link>
                      </TableCell>
                      <TableCell>{task.site?.name ?? "—"}</TableCell>
                      <TableCell>{FREQUENCY_LABELS[task.frequency] ?? task.frequency}</TableCell>
                      <TableCell className={overdue ? "font-medium text-red-600 dark:text-red-400" : undefined}>
                        {formatDate(task.nextRunAt)}
                      </TableCell>
                      <TableCell><StatusBadge meta={maintenanceStatusMeta[task.status]} /></TableCell>
                      <TableCell>
                        {task.status === "PENDING" && (
                          <MarkDoneButton
                            action={markMaintenanceDoneAction.bind(null, task.client.id, task.id)}
                            title="Marquer comme faite"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
