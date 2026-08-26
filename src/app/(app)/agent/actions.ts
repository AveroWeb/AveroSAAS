"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { parseAgentInput, type ParsedAgentInput } from "@/lib/ai/parse-agent-input";
import { agentConfirmSchema } from "@/lib/validation/agent";

export type AgentPreview = ParsedAgentInput & {
  suggestedClientId: string | null;
};

export async function parseAgentTextAction(text: string): Promise<AgentPreview> {
  const user = await requireStaff();
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Décris d'abord ce que tu as fait.");

  const todayIso = new Date().toISOString().slice(0, 10);
  const parsed = await parseAgentInput(trimmed, todayIso);

  const match = await prisma.client.findFirst({
    where: { organizationId: user.organizationId, companyName: { equals: parsed.clientName, mode: "insensitive" } },
    select: { id: true },
  });

  return { ...parsed, suggestedClientId: match?.id ?? null };
}

export async function confirmAgentAction(formData: FormData): Promise<{ clientId: string }> {
  const user = await requireStaff();
  const data = agentConfirmSchema.parse(Object.fromEntries(formData));

  let clientId = data.clientId || "";

  if (clientId) {
    const existing = await prisma.client.findFirst({
      where: { id: clientId, organizationId: user.organizationId },
      select: { id: true },
    });
    if (!existing) throw new Error("Client introuvable.");
  } else {
    const name = data.newClientName?.trim();
    if (!name) throw new Error("Le nom du client est requis.");
    const client = await prisma.client.create({
      data: {
        organizationId: user.organizationId,
        companyName: name,
        status: "ACTIVE",
      },
    });
    clientId = client.id;
    await prisma.activityLog.create({
      data: {
        organizationId: user.organizationId,
        clientId,
        userId: user.id,
        type: "CLIENT_CREATED",
        message: "Client créé via l'agent IA.",
      },
    });
  }

  const descriptionParts = [data.taskDescription?.trim(), data.amount?.trim() ? `Montant : ${data.amount.trim()}` : ""].filter(Boolean);

  const task = await prisma.task.create({
    data: {
      organizationId: user.organizationId,
      clientId,
      title: data.taskTitle,
      description: descriptionParts.length ? descriptionParts.join("\n\n") : null,
      status: "TODO",
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });

  await prisma.activityLog.create({
    data: {
      organizationId: user.organizationId,
      clientId,
      userId: user.id,
      type: "NOTE",
      message: `Tâche créée via l'agent IA : ${task.title}`,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return { clientId };
}
