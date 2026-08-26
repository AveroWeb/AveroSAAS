import { prisma } from "@/lib/prisma";

export async function listPlans(organizationId: string) {
  return prisma.plan.findMany({
    where: { organizationId },
    orderBy: { monthlyPrice: "asc" },
  });
}

export async function listSubscriptions(organizationId: string) {
  return prisma.subscription.findMany({
    where: { organizationId },
    include: { client: true, plan: true },
    orderBy: { startDate: "desc" },
  });
}
