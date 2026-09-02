import { toNumber } from "@/lib/format";
import type { ClientDetail } from "@/lib/queries/clients";

/**
 * Prisma `Decimal` instances cannot cross the server -> client component
 * boundary (they are not plain objects). Convert every Decimal field to a
 * plain number before passing client data into a "use client" component.
 */
export function serializeClientDetail(client: ClientDetail) {
  return {
    ...client,
    domains: client.domains.map((domain) => ({
      ...domain,
      annualCost: domain.annualCost === null ? null : toNumber(domain.annualCost),
    })),
    hostings: client.hostings.map((hosting) => ({
      ...hosting,
      monthlyCost: hosting.monthlyCost === null ? null : toNumber(hosting.monthlyCost),
      annualCost: hosting.annualCost === null ? null : toNumber(hosting.annualCost),
    })),
    tools: client.tools.map((tool) => ({
      ...tool,
      monthlyCost: tool.monthlyCost === null ? null : toNumber(tool.monthlyCost),
    })),
    subscriptions: client.subscriptions.map((subscription) => ({
      ...subscription,
      monthlyPrice: toNumber(subscription.monthlyPrice),
      plan: subscription.plan
        ? { ...subscription.plan, monthlyPrice: toNumber(subscription.plan.monthlyPrice) }
        : null,
    })),
    invoices: client.invoices.map((invoice) => ({
      ...invoice,
      amount: toNumber(invoice.amount),
      lineItems: invoice.lineItems.map((item) => ({
        ...item,
        quantity: toNumber(item.quantity),
        unitPrice: toNumber(item.unitPrice),
      })),
      subscription: invoice.subscription
        ? {
            ...invoice.subscription,
            monthlyPrice: toNumber(invoice.subscription.monthlyPrice),
            plan: invoice.subscription.plan
              ? { ...invoice.subscription.plan, monthlyPrice: toNumber(invoice.subscription.plan.monthlyPrice) }
              : null,
          }
        : null,
    })),
    quotes: client.quotes.map((quote) => ({
      ...quote,
      amount: toNumber(quote.amount),
      lineItems: quote.lineItems.map((item) => ({
        ...item,
        quantity: toNumber(item.quantity),
        unitPrice: toNumber(item.unitPrice),
      })),
      invoice: quote.invoice ? { ...quote.invoice, amount: toNumber(quote.invoice.amount) } : null,
    })),
  };
}

export type SerializedClientDetail = ReturnType<typeof serializeClientDetail>;
