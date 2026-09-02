import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { getInvoice } from "@/lib/queries/invoices";
import { formatCurrency, formatDate } from "@/lib/format";
import { AutoPrint } from "@/components/auto-print";

const STATUS_LABELS: Record<string, string> = {
  PAID: "Payée",
  UNPAID: "Impayée",
  OVERDUE: "En retard",
  CANCELLED: "Annulée",
};

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const invoice = await getInvoice(user.organizationId, id);
  if (!invoice) notFound();

  const reference = invoice.id.slice(-8).toUpperCase();
  const description = invoice.quote?.title ?? invoice.subscription?.plan?.name ?? "Prestation";

  return (
    <div className="mx-auto max-w-2xl bg-white p-10 text-black print:p-0">
      <AutoPrint />
      <div className="flex items-start justify-between border-b border-black/10 pb-6">
        <div>
          <p className="text-lg font-semibold">{invoice.organization.name}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight">FACTURE</p>
          <p className="text-sm text-black/60">N° {reference}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium uppercase text-black/50">Client</p>
          <p className="mt-1 font-medium">{invoice.client.companyName}</p>
          {invoice.client.contactName && <p className="text-sm">{invoice.client.contactName}</p>}
          {invoice.client.address && <p className="text-sm text-black/70">{invoice.client.address}</p>}
          {invoice.client.email && <p className="text-sm text-black/70">{invoice.client.email}</p>}
          {invoice.client.phone && <p className="text-sm text-black/70">{invoice.client.phone}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm">
            <span className="text-black/50">Date d&apos;émission : </span>
            {formatDate(invoice.issueDate)}
          </p>
          {invoice.dueDate && (
            <p className="text-sm">
              <span className="text-black/50">Échéance : </span>
              {formatDate(invoice.dueDate)}
            </p>
          )}
          <p className="text-sm">
            <span className="text-black/50">Statut : </span>
            {STATUS_LABELS[invoice.status] ?? invoice.status}
          </p>
        </div>
      </div>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/20 text-left">
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 text-right font-medium">Montant</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-black/10">
            <td className="py-3">{description}</td>
            <td className="py-3 text-right align-top">{formatCurrency(Number(invoice.amount))}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-3 text-right font-medium">Total</td>
            <td className="pt-3 text-right text-lg font-bold">{formatCurrency(Number(invoice.amount))}</td>
          </tr>
        </tfoot>
      </table>

      {invoice.notes && (
        <div className="mt-8 border-t border-black/10 pt-4">
          <p className="text-xs font-medium uppercase text-black/50">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
