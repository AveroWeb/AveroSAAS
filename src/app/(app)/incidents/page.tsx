import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Incidents — Mon Agence" };

export default async function IncidentsPage() {
  await requireStaff();
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Incidents</h1>
        <p className="text-sm text-muted-foreground">
          Suivi des pannes et incidents, tous clients confondus.
        </p>
      </div>
      <ComingSoon
        icon={AlertTriangle}
        title="Gestion des incidents — bientôt disponible"
        description="En attendant, retrouvez les incidents de chaque client dans sa fiche client, onglet « Incidents »."
      />
    </div>
  );
}
