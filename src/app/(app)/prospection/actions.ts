"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { searchLeads, type Lead } from "@/lib/scrapegraph/search-leads";

export type LeadPreview = Lead & {
  existingClientId: string | null;
};

export async function searchLeadsAction(query: string): Promise<LeadPreview[]> {
  const user = await requireStaff();
  const leads = await searchLeads(query);
  if (leads.length === 0) return [];

  const existing = await prisma.client.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true, companyName: true },
  });
  const existingByName = new Map(existing.map((c) => [c.companyName.trim().toLowerCase(), c.id]));

  return leads.map((lead) => ({
    ...lead,
    existingClientId: existingByName.get(lead.businessName.trim().toLowerCase()) ?? null,
  }));
}

export async function importLeadsAction(leads: LeadPreview[]): Promise<{ imported: number }> {
  const user = await requireStaff();
  const toImport = leads.filter((lead) => !lead.existingClientId);

  let imported = 0;
  for (const lead of toImport) {
    const qualityLabel =
      lead.websiteQuality === "none"
        ? "Pas de site web."
        : lead.websiteQuality === "outdated"
          ? "Site web daté/à refaire."
          : lead.websiteQuality === "modern"
            ? "Site web déjà moderne."
            : "Qualité du site inconnue.";
    const noteParts = [
      "Prospect trouvé via l'agent de prospection.",
      qualityLabel,
      lead.notes ?? "",
      lead.websiteUrl ? `Site : ${lead.websiteUrl}` : "",
    ].filter(Boolean);

    const client = await prisma.client.create({
      data: {
        organizationId: user.organizationId,
        companyName: lead.businessName,
        phone: lead.phone || null,
        address: lead.address || null,
        notes: noteParts.join("\n"),
        status: "PROSPECT",
      },
    });

    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        clientId: client.id,
        userId: user.id,
        type: "CLIENT_CREATED",
        message: "Prospect créé via l'agent de prospection.",
      },
    });

    imported += 1;
  }

  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return { imported };
}
