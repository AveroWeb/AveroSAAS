import { prisma } from "@/lib/prisma";

export async function listSites(organizationId: string, query?: string) {
  const trimmed = query?.trim();

  return prisma.site.findMany({
    where: {
      organizationId,
      ...(trimmed
        ? {
            OR: [
              { name: { contains: trimmed, mode: "insensitive" } },
              { url: { contains: trimmed, mode: "insensitive" } },
              { client: { companyName: { contains: trimmed, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { client: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSite(organizationId: string, siteId: string) {
  return prisma.site.findFirst({ where: { id: siteId, organizationId } });
}

export async function listClientOptions(organizationId: string) {
  return prisma.client.findMany({
    where: { organizationId },
    select: { id: true, companyName: true },
    orderBy: { companyName: "asc" },
  });
}
