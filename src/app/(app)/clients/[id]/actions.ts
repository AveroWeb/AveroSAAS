"use server";

import { revalidatePath } from "next/cache";
import { addDays, addWeeks, addMonths, addQuarters, addYears } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { domainSchema } from "@/lib/validation/domain";
import { hostingSchema } from "@/lib/validation/hosting";
import { toolSchema } from "@/lib/validation/tool";
import { taskSchema } from "@/lib/validation/task";
import { maintenanceSchema } from "@/lib/validation/maintenance";
import { incidentSchema } from "@/lib/validation/incident";
import { subscriptionSchema } from "@/lib/validation/subscription";
import { invoiceSchema } from "@/lib/validation/invoice";
import { quoteSchema } from "@/lib/validation/quote";

function toDecimal(value: string) {
  return value ? Number(value) : null;
}
function toDate(value: string) {
  return value ? new Date(value) : null;
}
async function assertClientOwnership(organizationId: string, clientId: string) {
  const client = await prisma.client.findFirst({ where: { id: clientId, organizationId }, select: { id: true } });
  if (!client) throw new Error("Client introuvable.");
}

// --- Domains ---------------------------------------------------------------

export async function saveDomainAction(domainId: string | null, formData: FormData) {
  const user = await requireStaff();
  const data = domainSchema.parse(Object.fromEntries(formData));
  await assertClientOwnership(user.organizationId, data.clientId);

  const payload = {
    clientId: data.clientId,
    siteId: data.siteId || null,
    name: data.name,
    isPrimary: data.isPrimary === "true",
    registrar: data.registrar || null,
    registrarUrl: data.registrarUrl || null,
    expiresAt: toDate(data.expiresAt ?? ""),
    autoRenew: data.autoRenew === "true",
    annualCost: toDecimal(data.annualCost ?? ""),
    status: data.status,
    notes: data.notes || null,
  };

  if (domainId) {
    await prisma.domain.update({ where: { id: domainId }, data: payload });
  } else {
    await prisma.domain.create({ data: { organizationId: user.organizationId, ...payload } });
  }
  revalidatePath(`/clients/${data.clientId}`);
}

export async function deleteDomainAction(clientId: string, domainId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  await prisma.domain.delete({ where: { id: domainId } });
  revalidatePath(`/clients/${clientId}`);
}

// --- Hosting -----------------------------------------------------------------

export async function saveHostingAction(hostingId: string | null, formData: FormData) {
  const user = await requireStaff();
  const data = hostingSchema.parse(Object.fromEntries(formData));
  await assertClientOwnership(user.organizationId, data.clientId);

  const payload = {
    clientId: data.clientId,
    siteId: data.siteId || null,
    provider: data.provider,
    dashboardUrl: data.dashboardUrl || null,
    serverType: data.serverType || null,
    accountRef: data.accountRef || null,
    monthlyCost: toDecimal(data.monthlyCost ?? ""),
    annualCost: toDecimal(data.annualCost ?? ""),
    renewsAt: toDate(data.renewsAt ?? ""),
    notes: data.notes || null,
  };

  if (hostingId) {
    await prisma.hosting.update({ where: { id: hostingId }, data: payload });
  } else {
    await prisma.hosting.create({ data: { organizationId: user.organizationId, ...payload } });
  }
  revalidatePath(`/clients/${data.clientId}`);
}

export async function deleteHostingAction(clientId: string, hostingId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  await prisma.hosting.delete({ where: { id: hostingId } });
  revalidatePath(`/clients/${clientId}`);
}

// --- Tools ---------------------------------------------------------------

export async function saveToolAction(toolId: string | null, formData: FormData) {
  const user = await requireStaff();
  const data = toolSchema.parse(Object.fromEntries(formData));
  await assertClientOwnership(user.organizationId, data.clientId);

  const payload = {
    clientId: data.clientId,
    siteId: data.siteId || null,
    name: data.name,
    category: data.category,
    url: data.url || null,
    identifier: data.identifier || null,
    monthlyCost: toDecimal(data.monthlyCost ?? ""),
    notes: data.notes || null,
  };

  if (toolId) {
    await prisma.tool.update({ where: { id: toolId }, data: payload });
  } else {
    await prisma.tool.create({ data: { organizationId: user.organizationId, ...payload } });
  }
  revalidatePath(`/clients/${data.clientId}`);
}

export async function deleteToolAction(clientId: string, toolId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  await prisma.tool.delete({ where: { id: toolId } });
  revalidatePath(`/clients/${clientId}`);
}

// --- Tasks ---------------------------------------------------------------

export async function saveTaskAction(taskId: string | null, clientId: string, formData: FormData) {
  const user = await requireStaff();
  const data = taskSchema.parse(Object.fromEntries(formData));
  await assertClientOwnership(user.organizationId, clientId);

  const payload = {
    clientId,
    siteId: data.siteId || null,
    title: data.title,
    description: data.description || null,
    status: data.status,
    priority: data.priority,
    dueDate: toDate(data.dueDate ?? ""),
  };

  if (taskId) {
    await prisma.task.update({ where: { id: taskId }, data: payload });
  } else {
    await prisma.task.create({ data: { organizationId: user.organizationId, ...payload } });
  }
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}

export async function deleteTaskAction(clientId: string, taskId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}

export async function toggleTaskDoneAction(clientId: string, taskId: string, done: boolean) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  await prisma.task.update({ where: { id: taskId }, data: { status: done ? "DONE" : "TODO" } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}

// --- Maintenance -----------------------------------------------------------

function nextRunFromFrequency(base: Date, frequency: string) {
  switch (frequency) {
    case "DAILY":
      return addDays(base, 1);
    case "WEEKLY":
      return addWeeks(base, 1);
    case "MONTHLY":
      return addMonths(base, 1);
    case "QUARTERLY":
      return addQuarters(base, 1);
    case "YEARLY":
      return addYears(base, 1);
    default:
      return base;
  }
}

export async function saveMaintenanceAction(maintenanceId: string | null, clientId: string, formData: FormData) {
  const user = await requireStaff();
  const data = maintenanceSchema.parse(Object.fromEntries(formData));
  await assertClientOwnership(user.organizationId, clientId);

  const payload = {
    clientId,
    siteId: data.siteId || null,
    title: data.title,
    description: data.description || null,
    frequency: data.frequency,
    status: data.status,
    nextRunAt: toDate(data.nextRunAt) ?? new Date(),
    lastRunAt: toDate(data.lastRunAt ?? ""),
  };

  if (maintenanceId) {
    await prisma.maintenanceTask.update({ where: { id: maintenanceId }, data: payload });
  } else {
    await prisma.maintenanceTask.create({ data: { organizationId: user.organizationId, ...payload } });
  }
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
}

export async function deleteMaintenanceAction(clientId: string, maintenanceId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  await prisma.maintenanceTask.delete({ where: { id: maintenanceId } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
}

export async function markMaintenanceDoneAction(clientId: string, maintenanceId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);

  const task = await prisma.maintenanceTask.findFirst({
    where: { id: maintenanceId, organizationId: user.organizationId },
  });
  if (!task) throw new Error("Maintenance introuvable.");

  const now = new Date();
  const isRecurring = task.frequency !== "ONCE";

  await prisma.maintenanceTask.update({
    where: { id: maintenanceId },
    data: {
      lastRunAt: now,
      status: isRecurring ? "PENDING" : "DONE",
      nextRunAt: isRecurring ? nextRunFromFrequency(now, task.frequency) : task.nextRunAt,
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      clientId,
      userId: user.id,
      type: "MAINTENANCE_DONE",
      message: `Maintenance effectuée : ${task.title}`,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
}

// --- Incidents ---------------------------------------------------------------

export async function saveIncidentAction(incidentId: string | null, clientId: string, formData: FormData) {
  const user = await requireStaff();
  const data = incidentSchema.parse(Object.fromEntries(formData));
  await assertClientOwnership(user.organizationId, clientId);

  const payload = {
    clientId,
    siteId: data.siteId || null,
    title: data.title,
    description: data.description || null,
    cause: data.cause || null,
    solution: data.solution || null,
    status: data.status,
    priority: data.priority,
    startedAt: toDate(data.startedAt) ?? new Date(),
    resolvedAt: toDate(data.resolvedAt ?? ""),
  };

  if (incidentId) {
    await prisma.incident.update({ where: { id: incidentId }, data: payload });
  } else {
    const incident = await prisma.incident.create({ data: { organizationId: user.organizationId, ...payload } });
    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        clientId,
        userId: user.id,
        type: "INCIDENT_OPENED",
        message: `Incident ouvert : ${incident.title}`,
      },
    });
  }
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
}

export async function deleteIncidentAction(clientId: string, incidentId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  await prisma.incident.delete({ where: { id: incidentId } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
}

export async function resolveIncidentAction(clientId: string, incidentId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);

  const incident = await prisma.incident.update({
    where: { id: incidentId },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      clientId,
      userId: user.id,
      type: "INCIDENT_RESOLVED",
      message: `Incident résolu : ${incident.title}`,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/incidents");
  revalidatePath("/dashboard");
}

export async function addIncidentEventAction(clientId: string, incidentId: string, formData: FormData) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  const message = String(formData.get("message") ?? "").trim();
  if (!message) throw new Error("Le message est requis.");

  await prisma.incidentEvent.create({ data: { incidentId, message } });
  revalidatePath(`/clients/${clientId}`);
}

// --- Subscriptions -----------------------------------------------------------

export async function saveSubscriptionAction(subscriptionId: string | null, clientId: string, formData: FormData) {
  const user = await requireStaff();
  const data = subscriptionSchema.parse(Object.fromEntries(formData));
  await assertClientOwnership(user.organizationId, clientId);

  const payload = {
    clientId,
    planId: data.planId || null,
    monthlyPrice: toDecimal(data.monthlyPrice) ?? 0,
    startDate: toDate(data.startDate) ?? new Date(),
    renewalDate: toDate(data.renewalDate ?? ""),
    status: data.status,
    description: data.description || null,
  };

  if (subscriptionId) {
    await prisma.subscription.update({ where: { id: subscriptionId }, data: payload });
  } else {
    await prisma.subscription.create({ data: { organizationId: user.organizationId, ...payload } });
    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        clientId,
        userId: user.id,
        type: "SUBSCRIPTION_STARTED",
        message: "Abonnement démarré.",
      },
    });
  }
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

export async function deleteSubscriptionAction(clientId: string, subscriptionId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  await prisma.subscription.delete({ where: { id: subscriptionId } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

// --- Invoices ----------------------------------------------------------------

export async function saveInvoiceAction(invoiceId: string | null, clientId: string, formData: FormData) {
  const user = await requireStaff();
  const data = invoiceSchema.parse(Object.fromEntries(formData));
  await assertClientOwnership(user.organizationId, clientId);

  const payload = {
    clientId,
    subscriptionId: data.subscriptionId || null,
    amount: toDecimal(data.amount) ?? 0,
    status: data.status,
    issueDate: toDate(data.issueDate) ?? new Date(),
    dueDate: toDate(data.dueDate ?? ""),
    paidAt: data.status === "PAID" ? new Date() : null,
    notes: data.notes || null,
  };

  if (invoiceId) {
    const existing = await prisma.invoice.findFirst({ where: { id: invoiceId, organizationId: user.organizationId } });
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { ...payload, paidAt: data.status === "PAID" ? (existing?.paidAt ?? new Date()) : null },
    });
  } else {
    await prisma.invoice.create({ data: { organizationId: user.organizationId, ...payload } });
  }
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function deleteInvoiceAction(clientId: string, invoiceId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  await prisma.invoice.delete({ where: { id: invoiceId } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function markInvoicePaidAction(clientId: string, invoiceId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "PAID", paidAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      clientId,
      userId: user.id,
      type: "PAYMENT_RECEIVED",
      message: `Facture de ${invoice.amount.toString()} € payée.`,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function generateInvoiceFromSubscriptionAction(clientId: string, subscriptionId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);

  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, organizationId: user.organizationId },
  });
  if (!subscription) throw new Error("Abonnement introuvable.");

  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 15);

  await prisma.invoice.create({
    data: {
      organizationId: user.organizationId,
      clientId,
      subscriptionId,
      amount: subscription.monthlyPrice,
      status: "UNPAID",
      issueDate,
      dueDate,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

// --- Quotes (devis) ------------------------------------------------------------

export async function saveQuoteAction(quoteId: string | null, clientId: string, formData: FormData) {
  const user = await requireStaff();
  const data = quoteSchema.parse(Object.fromEntries(formData));
  await assertClientOwnership(user.organizationId, clientId);

  const payload = {
    clientId,
    title: data.title,
    description: data.description || null,
    amount: toDecimal(data.amount) ?? 0,
    status: data.status,
    issueDate: toDate(data.issueDate) ?? new Date(),
    validUntil: toDate(data.validUntil ?? ""),
    notes: data.notes || null,
  };

  if (quoteId) {
    await prisma.quote.update({ where: { id: quoteId }, data: payload });
  } else {
    await prisma.quote.create({ data: { organizationId: user.organizationId, ...payload } });
  }
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/quotes");
}

export async function deleteQuoteAction(clientId: string, quoteId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);
  await prisma.quote.delete({ where: { id: quoteId } });
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/quotes");
}

export async function convertQuoteToInvoiceAction(clientId: string, quoteId: string) {
  const user = await requireStaff();
  await assertClientOwnership(user.organizationId, clientId);

  const quote = await prisma.quote.findFirst({
    where: { id: quoteId, organizationId: user.organizationId },
    include: { invoice: true },
  });
  if (!quote) throw new Error("Devis introuvable.");
  if (quote.invoice) throw new Error("Ce devis a déjà été converti en facture.");

  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 15);

  await prisma.$transaction([
    prisma.invoice.create({
      data: {
        organizationId: user.organizationId,
        clientId,
        quoteId: quote.id,
        amount: quote.amount,
        status: "UNPAID",
        issueDate,
        dueDate,
        notes: `Généré depuis le devis "${quote.title}".`,
      },
    }),
    prisma.quote.update({ where: { id: quoteId }, data: { status: "ACCEPTED" } }),
  ]);

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/quotes");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}
