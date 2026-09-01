import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { listInvoices, getInvoiceSummary } from "@/lib/queries/invoices";
import { StatusBadge, invoiceStatusMeta } from "@/components/status-badge";
import { MarkDoneButton } from "@/components/mark-done-button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { markInvoicePaidAction } from "@/app/(app)/clients/[id]/actions";

export const metadata: Metadata = { title: "Factures — Mon Agence" };

export default async function InvoicesPage() {
  const user = await requireStaff();
  const [invoices, summary] = await Promise.all([
    listInvoices(user.organizationId),
    getInvoiceSummary(user.organizationId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Factures</h1>
        <p className="text-sm text-muted-foreground">
          {invoices.length} facture{invoices.length > 1 ? "s" : ""}, tous clients confondus.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat label="Facturé ce mois-ci" value={formatCurrency(summary.billedThisMonth)} />
        <SummaryStat label="Encaissé ce mois-ci" value={formatCurrency(summary.paidThisMonth)} tone="success" />
        <SummaryStat label="Impayé (total)" value={formatCurrency(summary.unpaid)} tone={summary.unpaid > 0 ? "warning" : "default"} />
        <SummaryStat label="En retard" value={formatCurrency(summary.overdue)} tone={summary.overdue > 0 ? "danger" : "default"} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Émission</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Aucune facture. Génère-en une depuis un abonnement, ou crée-en une manuellement dans la fiche d&apos;un client.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link href={`/clients/${invoice.client.id}`} className="font-medium hover:underline">
                        {invoice.client.companyName}
                      </Link>
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell className={invoice.isOverdue ? "font-medium text-red-600 dark:text-red-400" : undefined}>
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge meta={invoice.isOverdue ? invoiceStatusMeta.OVERDUE : invoiceStatusMeta[invoice.status]} />
                    </TableCell>
                    <TableCell>
                      {(invoice.status === "UNPAID" || invoice.status === "OVERDUE") && (
                        <MarkDoneButton
                          action={markInvoicePaidAction.bind(null, invoice.client.id, invoice.id)}
                          title="Marquer comme payée"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : tone === "danger"
          ? "text-red-600 dark:text-red-400"
          : "";

  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
