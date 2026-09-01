import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, siteStatusMeta, siteTypeMeta, siteEnvironmentMeta } from "@/components/status-badge";
import { requireStaff } from "@/lib/session";
import { listSites } from "@/lib/queries/sites";
import { formatDate } from "@/lib/format";
import { SiteRowActions } from "./site-row-actions";

export const metadata: Metadata = { title: "Sites — Avero Saas" };

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireStaff();
  const { q } = await searchParams;
  const sites = await listSites(user.organizationId, q);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
          <p className="text-sm text-muted-foreground">
            {sites.length} site{sites.length > 1 ? "s" : ""}, tous clients confondus.
          </p>
        </div>
        <Button render={<Link href="/sites/new" />} nativeButton={false}>
          <Plus />
          Nouveau site
        </Button>
      </div>

      <form action="/sites" className="max-w-sm">
        <Input name="q" placeholder="Rechercher un site…" defaultValue={q ?? ""} />
      </form>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Environnement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Mise en ligne</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Aucun site trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-medium hover:underline"
                      >
                        {site.name}
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </a>
                      <span className="block text-xs text-muted-foreground">{site.url}</span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/clients/${site.client.id}`} className="hover:underline">
                        {site.client.companyName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge meta={siteTypeMeta[site.type]} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge meta={siteEnvironmentMeta[site.environment]} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge meta={siteStatusMeta[site.status]} />
                    </TableCell>
                    <TableCell>{formatDate(site.launchedAt)}</TableCell>
                    <TableCell>
                      <SiteRowActions siteId={site.id} siteName={site.name} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
