import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { requireStaff } from "@/lib/session";
import { listClientOptions } from "@/lib/queries/sites";
import { SiteForm } from "../site-form";
import { createSiteAction } from "../actions";

export const metadata: Metadata = { title: "Nouveau site — Mon Agence" };

export default async function NewSitePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const user = await requireStaff();
  const { clientId } = await searchParams;
  const clients = await listClientOptions(user.organizationId);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau site</h1>
        <p className="text-sm text-muted-foreground">Ajoutez un site pour un client.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <SiteForm
            action={createSiteAction}
            submitLabel="Créer le site"
            clients={clients}
            defaultValues={clientId ? { clientId } : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
