import Link from "next/link";
import { StatusBadge, taskPriorityMeta } from "@/components/status-badge";
import { formatDate } from "@/lib/format";

type TaskWithClient = {
  id: string;
  title: string;
  priority: string;
  dueDate: Date | null;
  client: { id: string; companyName: string } | null;
};

export function TaskItem({ task }: { task: TaskWithClient }) {
  return (
    <Link
      href={task.client ? `/clients/${task.client.id}` : "#"}
      className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{task.title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {task.client?.companyName ?? "—"}
          {task.dueDate ? ` · échéance ${formatDate(task.dueDate)}` : ""}
        </span>
      </span>
      <StatusBadge meta={taskPriorityMeta[task.priority]} />
    </Link>
  );
}
