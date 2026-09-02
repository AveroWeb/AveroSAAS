"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { quoteSchema } from "@/lib/validation/quote";

function toDecimal(value: string) {
  return value ? Number(value) : null;
}
function toDate(value: string) {
  return value ? new Date(value) : null;
}

export async function createQuoteAction(_prevState: string | undefined, formData: FormData) {
  const user = await requireStaff();

  let clientId: string;
  try {
    clientId = String(formData.get("clientId") ?? "");
    if (!clientId) return "Le client est requis.";

    const client = await prisma.client.findFirst({ where: { id: clientId, organizationId: user.organizationId } });
    if (!client) return "Client introuvable.";

    const data = quoteSchema.parse(Object.fromEntries(formData));

    await prisma.quote.create({
      data: {
        organizationId: user.organizationId,
        clientId,
        title: data.title,
        description: data.description || null,
        amount: toDecimal(data.amount) ?? 0,
        status: data.status,
        issueDate: toDate(data.issueDate) ?? new Date(),
        validUntil: toDate(data.validUntil ?? ""),
        notes: data.notes || null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message ?? "Données invalides.";
    }
    throw error;
  }

  revalidatePath("/quotes");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}
