import { requireStaff } from "@/lib/session";
import { ProspectionPanel } from "./prospection-panel";

export default async function ProspectionPage() {
  await requireStaff();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prospection</h1>
        <p className="text-muted-foreground">
          Cherche des entreprises (ex : &laquo;&nbsp;électricien Millau&nbsp;&raquo;) et repère celles sans site ou avec un site à refaire.
        </p>
      </div>
      <ProspectionPanel />
    </div>
  );
}
