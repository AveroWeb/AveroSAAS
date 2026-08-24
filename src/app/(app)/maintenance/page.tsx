import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Maintenance — Mon Agence" };

export default async function MaintenancePage() {
  await requireStaff();
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Maintenance</h1>
        <p className="text-sm text-muted-foreground">
          Suivi des maintenances récurrentes, tous clients confondus.
        </p>
      </div>
      <ComingSoon
        icon={Wrench}
        title="Gestion de la maintenance — bientôt disponible"
        description="En attendant, retrouvez les maintenances de chaque client dans sa fiche client, onglet « Maintenance »."
      />
    </div>
  );
}
