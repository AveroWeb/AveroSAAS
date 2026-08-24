"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { domainSchema } from "@/lib/validation/domain";
import { hostingSchema } from "@/lib/validation/hosting";
import { toolSchema } from "@/lib/validation/tool";
import { taskSchema } from "@/lib/validation/task";

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
