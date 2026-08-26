"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import { planSchema } from "@/lib/validation/plan";

export async function savePlanAction(planId: string | null, formData: FormData) {
  const user = await requireStaff();
  const data = planSchema.parse(Object.fromEntries(formData));

  const payload = {
    name: data.name,
    monthlyPrice: Number(data.monthlyPrice),
    description: data.description || null,
    isActive: data.isActive === "true",
  };

  if (planId) {
    const existing = await prisma.plan.findFirst({ where: { id: planId, organizationId: user.organizationId } });
    if (!existing) throw new Error("Forfait introuvable.");
    await prisma.plan.update({ where: { id: planId }, data: payload });
  } else {
    await prisma.plan.create({ data: { organizationId: user.organizationId, ...payload } });
  }
  revalidatePath("/subscriptions");
}

export async function deletePlanAction(planId: string) {
  const user = await requireStaff();
  const existing = await prisma.plan.findFirst({ where: { id: planId, organizationId: user.organizationId } });
  if (!existing) throw new Error("Forfait introuvable.");
  await prisma.plan.delete({ where: { id: planId } });
  revalidatePath("/subscriptions");
}
