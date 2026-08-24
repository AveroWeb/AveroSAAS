import type { Metadata } from "next";
import { Globe } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Sites — Mon Agence" };

export default async function SitesPage() {
  await requireStaff();
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de tous les sites, tous clients confondus.
        </p>
      </div>
      <ComingSoon
        icon={Globe}
        title="Gestion des sites — bientôt disponible"
        description="En attendant, retrouvez les sites de chaque client dans sa fiche client, onglet « Sites »."
      />
    </div>
  );
}
