import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { requireStaff } from "@/lib/session";
import { getSite, listClientOptions } from "@/lib/queries/sites";
import { SiteForm } from "../../site-form";
import { updateSiteAction } from "../../actions";

export const metadata: Metadata = { title: "Modifier le site — Avero Saas" };

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const [site, clients] = await Promise.all([
    getSite(user.organizationId, id),
    listClientOptions(user.organizationId),
  ]);
  if (!site) notFound();

  const action = updateSiteAction.bind(null, site.id);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Modifier {site.name}</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <SiteForm action={action} submitLabel="Enregistrer" clients={clients} defaultValues={site} />
        </CardContent>
      </Card>
    </div>
  );
}
