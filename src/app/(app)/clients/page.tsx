import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { StatusBadge, clientStatusMeta } from "@/components/status-badge";
import { requireStaff } from "@/lib/session";
import { listClients } from "@/lib/queries/clients";
import { formatCurrency, toNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Clients — Avero Saas",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireStaff();
  const { q } = await searchParams;
  const clients = await listClients(user.organizationId, q);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {clients.length} client{clients.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/clients/new" />} nativeButton={false}>
          <Plus />
          Nouveau client
        </Button>
      </div>

      <form action="/clients" className="max-w-sm">
        <Input name="q" placeholder="Rechercher un client…" defaultValue={q ?? ""} />
      </form>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Sites</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Problèmes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Aucun client trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => {
                  const mrr = client.subscriptions.reduce(
                    (sum, s) => sum + toNumber(s.monthlyPrice),
                    0,
                  );
                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <Link href={`/clients/${client.id}`} className="block">
                          <span className="font-medium">{client.companyName}</span>
                          {client.contactName && (
                            <span className="block text-xs text-muted-foreground">
                              {client.contactName}
                            </span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/clients/${client.id}`} className="block">
                          <StatusBadge meta={clientStatusMeta[client.status]} />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/clients/${client.id}`} className="block">
                          {client._count.sites}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/clients/${client.id}`} className="block">
                          {formatCurrency(mrr)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/clients/${client.id}`} className="block">
                          {client._count.incidents > 0 ? (
                            <span className="font-medium text-red-600 dark:text-red-400">
                              {client._count.incidents} ouvert
                              {client._count.incidents > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
