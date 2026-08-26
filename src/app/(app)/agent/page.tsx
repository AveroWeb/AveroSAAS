import { requireStaff } from "@/lib/session";
import { listClientOptions } from "@/lib/queries/sites";
import { AgentPanel } from "./agent-panel";

export default async function AgentPage() {
  const user = await requireStaff();
  const clients = await listClientOptions(user.organizationId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agent IA</h1>
        <p className="text-muted-foreground">
          Décris en une phrase ce que tu viens de faire, l&apos;agent range ça pour toi.
        </p>
      </div>
      <AgentPanel clients={clients} />
    </div>
  );
}
