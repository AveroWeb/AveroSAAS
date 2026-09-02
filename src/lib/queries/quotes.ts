import { prisma } from "@/lib/prisma";

export async function listQuotes(organizationId: string) {
  return prisma.quote.findMany({
    where: { organizationId },
    include: { client: true, invoice: true },
    orderBy: { issueDate: "desc" },
  });
}
