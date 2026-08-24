"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { siteSchema } from "@/lib/validation/site";

function parseDate(value: string) {
  return value ? new Date(value) : null;
}

function parseSiteForm(formData: FormData) {
  return siteSchema.parse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
    url: formData.get("url"),
    type: formData.get("type"),
    environment: formData.get("environment"),
    status: formData.get("status"),
    repositoryUrl: formData.get("repositoryUrl"),
    stagingUrl: formData.get("stagingUrl"),
    launchedAt: formData.get("launchedAt"),
    lastBackupAt: formData.get("lastBackupAt"),
    notes: formData.get("notes"),
  });
}

export async function createSiteAction(_prevState: string | undefined, formData: FormData) {
  const user = await requireStaff();

  let siteId: string;
  try {
    const data = parseSiteForm(formData);
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!client) return "Client introuvable.";

    const site = await prisma.site.create({
      data: {
        organizationId: user.organizationId,
        clientId: data.clientId,
        name: data.name,
        url: data.url,
        type: data.type,
        environment: data.environment,
        status: data.status,
        repositoryUrl: data.repositoryUrl || null,
        stagingUrl: data.stagingUrl || null,
        launchedAt: parseDate(data.launchedAt ?? ""),
        lastBackupAt: parseDate(data.lastBackupAt ?? ""),
        notes: data.notes || null,
      },
    });
    siteId = site.id;

    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        clientId: data.clientId,
        userId: user.id,
        type: "SITE_CREATED",
        message: `Site "${data.name}" créé.`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message ?? "Données invalides.";
    }
    throw error;
  }

  revalidatePath("/sites");
  revalidatePath("/dashboard");
  redirect(`/sites/${siteId}/edit`);
}

export async function updateSiteAction(
  siteId: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const user = await requireStaff();

  try {
    const existing = await prisma.site.findFirst({
      where: { id: siteId, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!existing) return "Site introuvable.";

    const data = parseSiteForm(formData);
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!client) return "Client introuvable.";

    await prisma.site.update({
      where: { id: siteId },
      data: {
        clientId: data.clientId,
        name: data.name,
        url: data.url,
        type: data.type,
        environment: data.environment,
        status: data.status,
        repositoryUrl: data.repositoryUrl || null,
        stagingUrl: data.stagingUrl || null,
        launchedAt: parseDate(data.launchedAt ?? ""),
        lastBackupAt: parseDate(data.lastBackupAt ?? ""),
        notes: data.notes || null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message ?? "Données invalides.";
    }
    throw error;
  }

  revalidatePath("/sites");
  revalidatePath(`/sites/${siteId}`);
  revalidatePath("/dashboard");
  redirect("/sites");
}

export async function deleteSiteAction(siteId: string) {
  const user = await requireStaff();

  const existing = await prisma.site.findFirst({
    where: { id: siteId, organizationId: user.organizationId },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.site.delete({ where: { id: siteId } });

  revalidatePath("/sites");
  revalidatePath("/dashboard");
}
