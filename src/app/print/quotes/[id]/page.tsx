import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { getQuote } from "@/lib/queries/quotes";
import { formatCurrency, formatDate } from "@/lib/format";
import { AutoPrint } from "@/components/auto-print";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyé",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
};

export default async function QuotePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const quote = await getQuote(user.organizationId, id);
  if (!quote) notFound();

  const reference = quote.id.slice(-8).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl bg-white p-10 text-black print:p-0">
      <AutoPrint />
      <div className="flex items-start justify-between border-b border-black/10 pb-6">
        <div>
          <p className="text-lg font-semibold">{quote.organization.name}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tracking-tight">DEVIS</p>
          <p className="text-sm text-black/60">N° {reference}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium uppercase text-black/50">Client</p>
          <p className="mt-1 font-medium">{quote.client.companyName}</p>
          {quote.client.contactName && <p className="text-sm">{quote.client.contactName}</p>}
          {quote.client.address && <p className="text-sm text-black/70">{quote.client.address}</p>}
          {quote.client.email && <p className="text-sm text-black/70">{quote.client.email}</p>}
          {quote.client.phone && <p className="text-sm text-black/70">{quote.client.phone}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm">
            <span className="text-black/50">Date d&apos;émission : </span>
            {formatDate(quote.issueDate)}
          </p>
          {quote.validUntil && (
            <p className="text-sm">
              <span className="text-black/50">Valable jusqu&apos;au : </span>
              {formatDate(quote.validUntil)}
            </p>
          )}
          <p className="text-sm">
            <span className="text-black/50">Statut : </span>
            {STATUS_LABELS[quote.status] ?? quote.status}
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
            <td className="py-3">
              <p className="font-medium">{quote.title}</p>
              {quote.description && <p className="mt-1 whitespace-pre-wrap text-black/70">{quote.description}</p>}
            </td>
            <td className="py-3 text-right align-top">{formatCurrency(Number(quote.amount))}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-3 text-right font-medium">Total</td>
            <td className="pt-3 text-right text-lg font-bold">{formatCurrency(Number(quote.amount))}</td>
          </tr>
        </tfoot>
      </table>

      {quote.notes && (
        <div className="mt-8 border-t border-black/10 pt-4">
          <p className="text-xs font-medium uppercase text-black/50">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{quote.notes}</p>
        </div>
      )}
    </div>
  );
}
