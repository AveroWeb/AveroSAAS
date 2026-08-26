"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { memberSchema } from "@/lib/validation/member";

export async function createMemberAction(formData: FormData) {
  const user = await requireAdmin();
  const data = memberSchema.parse(Object.fromEntries(formData));
  const email = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Un compte existe déjà avec cet email.");

  const passwordHash = await bcrypt.hash(data.password, 12);
  await prisma.user.create({
    data: {
      organizationId: user.organizationId,
      email,
      name: data.name,
      passwordHash,
      role: data.role,
    },
  });

  revalidatePath("/settings");
}

export async function deleteMemberAction(memberId: string) {
  const user = await requireAdmin();
  if (memberId === user.id) throw new Error("Vous ne pouvez pas supprimer votre propre compte.");

  const member = await prisma.user.findFirst({
    where: { id: memberId, organizationId: user.organizationId },
  });
  if (!member) throw new Error("Membre introuvable.");

  if (member.role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { organizationId: user.organizationId, role: "ADMIN" },
    });
    if (adminCount <= 1) throw new Error("Impossible de supprimer le dernier administrateur.");
  }

  await prisma.user.delete({ where: { id: memberId } });
  revalidatePath("/settings");
}
