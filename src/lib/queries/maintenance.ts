import { prisma } from "@/lib/prisma";

export async function listMaintenanceTasks(organizationId: string) {
  const now = new Date();
  const tasks = await prisma.maintenanceTask.findMany({
    where: { organizationId },
    include: { client: true, site: true },
    orderBy: { nextRunAt: "asc" },
  });
  return tasks.map((task) => ({ ...task, overdue: task.status === "PENDING" && task.nextRunAt < now }));
}
