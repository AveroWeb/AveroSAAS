import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = { title: "Abonnements — Mon Agence" };

export default async function SubscriptionsPage() {
  await requireStaff();
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Abonnements</h1>
        <p className="text-sm text-muted-foreground">
          Forfaits, MRR et rentabilité, tous clients confondus.
        </p>
      </div>
      <ComingSoon
        icon={CreditCard}
        title="Gestion des abonnements — bientôt disponible"
        description="Le MRR global est déjà visible sur le Dashboard. Le détail par client se trouve dans sa fiche, onglet « Notes »."
      />
    </div>
  );
}
