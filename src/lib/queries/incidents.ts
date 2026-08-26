import { prisma } from "@/lib/prisma";

export async function listIncidents(organizationId: string) {
  return prisma.incident.findMany({
    where: { organizationId },
    include: { client: true, site: true },
    orderBy: [{ status: "asc" }, { startedAt: "desc" }],
  });
}
